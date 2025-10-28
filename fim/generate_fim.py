#!/usr/bin/env python3

import os
import typer
import numpy
import shutil
import pandas
from pathlib import Path
from typing import List, Union

import rasterio
from rasterio import Affine

from typing_extensions import Annotated

from fimserve import datadownload as fm
from fimserve import runFIM
import compute_rating_increments as cr

from concurrent.futures import ProcessPoolExecutor

import subprocess


app = typer.Typer(
    context_settings={"help_option_names": ["-h", "--help"]}, add_completion=False
)


def __write_flow_input_file(
    reach_ids: List[str], flow_rates: List[float], output_label: str
) -> Path:
    """
    Writes the flow rate to a file for the specified reach identifier. This
    is used as input to the FIM calculation. The resulting file will only
    contain a single discharge value for each of the provided reach ids.

    The format of this file is:
      feature_id,discharge
      11239503,173.59
      11239409,140.62
      11239425,140.23
      ...

    Arguments:
        reach_ids - List[str]: A list of NWM reach identifiers for the specific reach.
        flow_rates - List[float]: A list of flow rates in cubic meters per second to use for the FIM generation.
        output_label - str: The label that will be used to name the input file.
    Returns:
        pathlib.Path: The path to the generated flow rate file.

    """

    if len(reach_ids) != len(flow_rates):
        raise Exception("The number of reach ids must match the number of flow rates")

    # TODO: replace the flows.csv path with a global variable
    basepath = Path("/home/data/inputs")

    with open(basepath / output_label, "w") as f:
        f.write("feature_id,discharge\n")
        for i in range(0, len(reach_ids)):
            f.write(f"{reach_ids[i]},{flow_rates[i]}\n")

    return basepath / output_label


def __download_huc_fim(huc_id: str, fim_data_dir: Path) -> None:
    """
    Downloads the FIM map for a specific HUC identifier.

    Arguments:
        huc_id - str: The HUC identifier for the watershed.
    Returns:
        None
    """

    if not fim_data_dir.exists():
        # Download the HUC input data if it does not exist.
        fm.DownloadHUC8(huc_id)
    else:
        print("FIM Data Already Exists. Skipping download.")
        # if the data already exists, perfom the remaining
        # setup tasks outlined in the DownloadHUC8 function.

        code_dir, data_dir, output_dir = fm.setup_directories()
        fm.EnvFile(code_dir)


#        HUC_dir = os.path.join(output_dir, f"flood_{huc_id}")
#        hydrotable_dir = os.path.join(HUC_dir, str(huc_id), "hydrotable.csv")
#        featureID_dir = os.path.join(HUC_dir, "feature_IDs.csv")
#        fm.uniqueFID(hydrotable_dir, featureID_dir)


def __generate_fim(huc_id, flow_rate_filepath, label="") -> None:
    """
    Generates a FIM map for a specific HUC and input flow rate file.

    Arguments:
        huc_id - str: The HUC identifier for the watershed.
        flow_rate_filepath - pathlib.Path: The path to the flow rate file.
    Returns:
        pathlib.Path: The path to the generated FIM map.
    """

    code_dir = "/home/code/inundation-mapping"
    output_dir = "/home/output"
    runFIM.runfim(code_dir, output_dir, huc_id, flow_rate_filepath, label)


def __crop_data(array, geotiff_profile):

    # Identify the bounding box where values == 1
    rows, cols = numpy.where(array == 1)

    if rows.size == 0 or cols.size == 0:
        raise ValueError("No values equal to 1 in the dataset.")

    # Calculate new bounding box
    row_min, row_max = rows.min(), rows.max()
    col_min, col_max = cols.min(), cols.max()

    # crop the data to the new extent
    cropped_data = array[row_min : row_max + 1, col_min : col_max + 1]

    # Update the transform to reflect the new bounding box
    transform = geotiff_profile["transform"]
    new_transform = transform * Affine.translation(col_min, row_min)

    geotiff_profile.update(
        {
            "height": cropped_data.shape[0],
            "width": cropped_data.shape[1],
            "transform": new_transform,
            "dtype": "float32",
        }
    )

    return cropped_data, geotiff_profile


def __clean_fim_geotiff(
    geotiff_path: Path,
) -> None:
    """
    Clean the geotiff created by the FIM mosaic process.
    Replace all values greater than 0 with 1 and set all
    values less than or equal to 0 to 0.

    Arguments:
        geotiff_path: Path - Path to the geotiff file
    Returns:
        None
    """

    # Load the geotiff into memory
    cleaned_data = None
    with rasterio.open(geotiff_path) as src:
        # read the first band. Only one band should be present.
        data = src.read(1)
        profile = src.profile

        try:
            # set all values greater than 0 to 1, otherwise NaN
            cleaned_data = numpy.where(data <= 0, numpy.nan, 1)
        except Exception as e:
            raise RuntimeError(f"Numpy: {e}, i.e. no flooding event found")

    # crop the data and set a new bounding box
    print(f"Cropping FIM Results for {geotiff_path}...")
    cropped_data, cropped_profile = __crop_data(cleaned_data, profile)

    # set datya type to float32 to account for nan values, -9999.0
    cropped_profile.update(dtype=rasterio.float32, count=1)

    with rasterio.open(geotiff_path, "w", **cropped_profile) as dst:
        dst.write(cropped_data.astype(rasterio.float32), 1)


def __compute_fim_scenario(i, huc_id, reach_id, flow_rate_filepath, label):
    print(f"Computing FIM for {huc_id}:{reach_id} - input:{flow_rate_filepath}  - label: {label} \t [{i+1}]")
    __generate_fim(huc_id, flow_rate_filepath, label)
    

def __clean_fims(
    directory: Annotated[
        Path,
        typer.Argument(
            ...,
            help="Path to the root directory which contains the FIM maps that will be cleaned",
        ),
    ],
) -> None:
    """
    Cleans all FIMs in the input directory by eliminating all negative values. This searches for all geotiff files that exist in subdirectories of the input directory and places the cleaned files in the "input directory"

    Arguments:
    ==========
        directory - Path: The root directory containing FIM input geotiffs.

    Returns:
    ========
        None

    """

    # clean the geotiff that was created by replacing
    # all values less than or equal to 0 with 0 and all
    # others with 1. Move the processed files up to the
    # parent directory and remove all temp directories.
    output_messages = []
    dirs_to_remove = []
    for fpath in Path(directory).glob("**/*.tif"):
        try:
            print(f"Cleaning FIM Results for {fpath.name}...")
            __clean_fim_geotiff(fpath)

            # output_messages.append(f"{fpath.name} processing SUCCESS.")
            # print(f'Moving: {fpath} -> {directory/fpath.name}')
            # shutil.move(fpath, directory / fpath.name)

        except Exception as e:
            output_messages.append(f"{fpath.name} processing FAIL. -> {e}")
            print(f"Error cleaning FIM results for {fpath.name}.\n{e}")

        # finally:
        #     dirs_to_remove.append(fpath.parent)

    # # remove old artifacts
    # for parent_dir in dirs_to_remove:
    #     # only remove directories that are not the input directory
    #     if parent_dir != directory:
    #         print(f'Removing: {parent_dir}')
    #         shutil.rmtree(parent_dir, ignore_errors=True)

    # # save log messages for future reference
    # with open(directory / "logs.txt", "a") as log_file:
    #     for output_message in output_messages:
    #         log_file.write(f"{output_message}\n")
    
    
def __convert_to_cog(root_dir: Path) -> None:

    failed_conversions = []
    for input_tif in Path(root_dir).glob("**/*.tif"):
        output_cog = input_tif.with_suffix(".cog")
        print(f'Convert to COG: {input_tif} -> {output_cog}')
        try:
            cmd = [
                "gdal_translate",
                str(input_tif),
                str(output_cog),
                "-of",
                "COG",
                "-co",
                "COMPRESS=DEFLATE",
                "-co",
                "BLOCKSIZE=512",
                "-co",
                "OVERVIEW_RESAMPLING=NEAREST",
            ]
            subprocess.run(
                cmd,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

        except subprocess.CalledProcessError as e:
            msg = f"Error converting {input_tif} to COG: {e}. STDOUT: {e.stdout}. STDERR: {e.stderr}"
            failed_conversions.append(msg)

    if len(failed_conversions) > 0:
        raise Exception(
            "One or more COG conversions failed:\n" + "\n".join(failed_conversions)
        )


@app.command(name="reachfim_interval")
def generate_reach_fim_at_intervals(
    huc_id: Annotated[
        str,
        typer.Argument(
            ...,
            help="The HUC-8 identifier for the watershed.",
        ),
    ] = "03020202",
    reach_id: Annotated[
        str,
        typer.Argument(
            ...,
            help="An NWM identifiers for the reache of interest.",
        ),
    ] = "11239409",
    stage_increment: Annotated[
        float,
        typer.Argument(
            ...,
            help="The stage increment in meteres that will be used to subdivide the rating curve into flows",
        ),
    ] = 0.5,
    max_procs: Annotated[
        int,
        typer.Argument(
            ...,
            help="The number of cuncorrent processes that we execute",
        ),
    ] = 1,
    subdir: Annotated[
        Union[str, None],
        typer.Argument(
            ...,
            help="The subdirectory where the FIM maps will be saved. This is used to avoid overwriting existing FIM maps.",
        ),
    ] = None,
) -> None:
    """
    Generates a FIM maps for a specific HUC and nwm reach identifier using
    flow rates derived from rating curves.

    Arguments:
    ==========
        huc_id - str: The HUC-8 identifier for the watershed.
        reach_ids - str: A comma separated list of NWM reach identifier for the reaches of interest.
        stage_increment - float: The stage increment in meteres that will be used to subdivide the rating curve into flows

    Returns:
    ========
        None

    """

    # TODO: This is hardcoded for now, but should be an important parameter in the future.
    fim_data_dir = f"/home/output/flood_{huc_id}/{huc_id}"

    # download HUC data if it doesn't exist
    __download_huc_fim(huc_id, Path(fim_data_dir))

    # compute flow from stage increments
    print("Computing rating increments...", end="")
    stage, flow = cr.compute_rating_increments(
        huc_id=huc_id, reach_id=reach_id, increment=stage_increment, verbose=False
    )
    print("done")

    # omit the first stage and flow values if the first stage
    # is equal to 0, since there's no point in computing a FIM.
    if stage[0] == 0:
        df = pandas.DataFrame({"stage_m": stage[1:], "cms": flow[1:]})
    else:
        df = pandas.DataFrame({"stage_m": stage[:], "cms": flow[:]})
    print("Generating FIM for the following scenarios:")
    print(df)

    # Generate Labels
    print("Generating output labels...", end="")
    flow_labels = [f"{str(int(v))}_cms" for v in df.cms.values]
    flows = df.cms.values

    stage_labels = [
        f"{str(round(v, 1)).replace('.','_')}_m" for v in df["stage_m"].values
    ]
    labels = [
        f"{reach_id}__{stage_labels[i]}__{flow_labels[i]}"
        for i in range(0, len(flow_labels))
    ]
    print("done")

    # write the input files that will be used to generate the FIM
    print("Writing input files...", end="")
    flow_rate_filepaths = []
    for i in range(0, len(labels)):
        flow_rate_filepaths.append(
            __write_flow_input_file([reach_id], [flows[i]], labels[i])
        )
    print("done")

    # define the root path where the final FIM maps will be saved.
    root_path = f"/home/output/flood_{huc_id}/{huc_id}_inundation"
    root_label = ""
    if subdir is not None:
        root_path = f"/home/output/flood_{huc_id}/{huc_id}_inundation/{subdir}"
        root_label = f"{subdir}/"

    with ProcessPoolExecutor(max_workers=max_procs) as executor:

        futures = []
        for i in range(len(flow_rate_filepaths)):

            # build the output path and output label specifdic to the scenario
            # these extend the root_path and root_label objects to account for
            # the optional sub_dir argument.
            p = f"{root_path}/scenario_{i}"
            label = f"{root_label}scenario_{i}"

            # skip files that already exist
            if Path(p).exists():
                print(
                    f"Skipping scenario {i} for {huc_id}:{reach_id} - already exists."
                )
                continue

            futures.append(
                executor.submit(
                    __compute_fim_scenario,
                    i,
                    huc_id,
                    reach_id,
                    flow_rate_filepaths[i],
                    label,
                )
            )

    # clean the generated fim maps to remove negative values. The
    # output will be geotiffs containing 0's where no inundation
    # exists and 1's where inundation exists.
    __clean_fims(Path(root_path))

    # convert the output into COG format
    __convert_to_cog(Path(root_path))


@app.command(name="reachfim")
def generate_reach_fim(
    huc_id: Annotated[
        str,
        typer.Argument(
            ...,
            help="The HUC-8 identifier for the watershed.",
        ),
    ] = "03020202",
    reach_ids: Annotated[
        str,
        typer.Argument(
            ...,
            help="A comma separated list of NWM identifiers for the reaches of interest.",
        ),
    ] = "11239409",
    flow_rates: Annotated[
        str,
        typer.Argument(
            ...,
            help="A comma separated list of flow rates corresponding to the reach_ids to use for FIM generation, in cubic meters per second.",
        ),
    ] = "200.23",
    max_procs: Annotated[
        int,
        typer.Argument(
            ...,
            help="The number of concurrent processes that we execute",
        ),
    ] = 1,
    output_labels: Annotated[
        str,
        typer.Argument(
            ...,
            help="A comma separated list of labels to use when saving the fim outputs.",
        ),
    ] = None,
    subdir: Annotated[
        Union[str, None],
        typer.Argument(
            ...,
            help="The subdirectory where the FIM maps will be saved. This is used to avoid overwriting existing FIM maps.",
        ),
    ] = None,
) -> None:
    """
    Generates a FIM map for a specific HUC and nwm reach identifier using
    the provided flow rate. This assumes that a single flow rate is provided
    for each reach identifier.

    Arguments:
    ==========
        huc_id - str: The HUC-8 identifier for the watershed.
        reach_ids - str: A comma separated list of NWM reach identifier for the reaches of interest.
        flow_rates - str: A comma replace list of flow rates corresponding to the reach_ids to use for FIM generation, in cubic meters per second.
        max_procs - 
        output_labels -
        subdir - 

    Returns:
    ========
        None

    """

    # TODO: make sure that we have the same number of input args

    print(f'Max number of Processes: {max_procs}')

    # parse reach_ids and flow_rates
    r_ids = reach_ids.split(",")
    print(f'Found the following reach ids: {r_ids}')
    
    f_rates = [float(x) for x in flow_rates.split(",")]
    print(f'Found the following flow rates: {f_rates}')

    # TODO: This is hardcoded for now, but should be an important parameter in the future.
    fim_data_dir = f"/home/output/flood_{huc_id}/{huc_id}"
    print(f'FIM data directory: {fim_data_dir}')

    # download HUC data if it doesn't exist
    __download_huc_fim(huc_id, Path(fim_data_dir))

    # generate output file names if not provided
    if output_labels is None: 
        output_labels = []
        for i in range(0, len(r_ids)):
            # round stage to 1 decimal place and replace '.' with '_' for clarity
            rounded_stage = round(cr.get_stage(huc_id, r_ids[i], f_rates[i]), 1)
            stage_label = str(rounded_stage).replace(".", "_")
    
            # round flow to 0 devimal places and replace '.' with '_' for clarity
            flow_label = str(int(f_rates[i]))
            output_labels.append(f"{r_ids[i]}__{stage_label}_m__{flow_label}_cms")
    else:
        output_labels = output_labels.split(',')
    
    print('Using the following output labels:')
    for output_label in output_labels:
        print(f'  - {output_label}')
              
    # write the input files that will be used to generate the FIM
    flow_rate_filepaths = []
    for i in range(0, len(r_ids)):
        flow_rate_filepaths.append(
            __write_flow_input_file([r_ids[i]], [f_rates[i]], output_labels[i])
        )
        
    with ProcessPoolExecutor(max_workers=max_procs) as executor:

        futures = []
        for i in range(0, len(flow_rate_filepaths)):
            # compute FIM using the mosaic approach established
            # by NOAA OWP.
            futures.append(
                executor.submit(
                    __compute_fim_scenario,
                    i,
                    huc_id,
                    r_ids[i],
                    flow_rate_filepaths[i],
                    output_labels[i],
                )
            )

    # save the root path where the final FIM maps will be saved.
    root_path = Path(f"/home/output/flood_{huc_id}/{huc_id}_inundation")

    log_contents = []
    # loop through each reach and move all tiff files into a
    # subdirectory named after the reach. Concat all log files 
    # in the process.

    print('----------------------------------')
    print('COMPLETED GENERATING FIM SCENARIOS')
    print('----------------------------------')
    
    for r_id in list(set(r_ids)):
        
        print(f'--- POST PROCESSING REACH {r_id} ---')
        
        target_path = root_path/r_id
        
        # create output dir for this reach
        print(f'Making dir: {target_path}')
        target_path.mkdir(parents=True, exist_ok=True)

        for item in root_path.iterdir():
            if item.is_dir():
                if item.name.split('__')[0] == r_id:
                    for file in item.glob('*'):
                        if file.suffix.lower() == '.tif':
                            
                            dest = target_path/file.name
                            print(f"  - Moving {file} -> {dest}")
                            shutil.move(str(file), str(dest))
                        
    # clean the generated fim maps to remove negative values. The
    # output will be geotiffs containing 0's where no inundation
    # exists and 1's where inundation exists.
    print('--- CLEANING FIMs ---')
    __clean_fims(target_path)

    print('-- CREATING COGs ---')
    # convert the output into COG format
    __convert_to_cog(target_path)

    # Cleaning temporary directories
    print('--- CLEANING TEMPORARY DIRECTORIES ---')
    for label in output_labels:
        temp_dir = root_path / label
        try:
            shutil.rmtree(temp_dir)
            print(f"Directory and its contents removed successfully: {temp_dir}")
        except OSError as e:
            print(f"Failed to remove directory: {temp_dir} : {e.strerror}")
        
        
    # # Write combined log.txt in root_path
    # if log_contents:
    #     with open(f'{target_path}/log.txt', "w") as out_log:
    #         out_log.write("\n".join(log_contents))
    



@app.command(name="clean")
def clean_fims_cmd(
    directory: Annotated[
        Path,
        typer.Argument(
            ...,
            help="Path to the root directory which contains the FIM maps that will be cleaned",
        ),
    ],
) -> None:
    """
    Cleans FIM maps by eliminating all negative values. This searches for all geotiff files that
    exist in subdirectories of the input directory and places the cleaned files in the "input directory"

    Arguments:
    ==========
        directory - Path: The root directory containing FIM input geotiffs.

    Returns:
    ========
        None

    """

    # clean the geotiff that was created by replacing
    # all values less than or equal to 0 with 0 and all
    # others with 1. Move the processed files up to the
    # parent directory and remove all temp directories.
    __clean_fims(directory)


if __name__ == "__main__":
    app()
