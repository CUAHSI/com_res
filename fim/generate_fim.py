#!/usr/bin/env python3

import typer
import numpy
import rasterio
import fimserve as fm
from typing import List
from pathlib import Path
from fimserve import runFIM
from rasterio import Affine
from typing_extensions import Annotated


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


def __download_huc_fim(huc_id: str) -> None:
    """
    Downloads the FIM map for a specific HUC identifier.

    Arguments:
        huc_id - str: The HUC identifier for the watershed.
    Returns:
        None
    """

    # Download the data for one huc
    fm.DownloadHUC8(huc_id)


def __generate_fim(huc_id, flow_rate_filepath) -> None:
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
    runFIM.runfim(code_dir, output_dir, huc_id, flow_rate_filepath)


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

        # set all values greater than 0 to 1, otherwise NaN
        cleaned_data = numpy.where(data <= 0, numpy.nan, 1)

    # crop the data and set a new bounding box
    cropped_data, cropped_profile = __crop_data(cleaned_data, profile)

    # set datya type to float32 to account for nan values, -9999.0
    cropped_profile.update(dtype=rasterio.float32, count=1)

    with rasterio.open(geotiff_path, "w", **cropped_profile) as dst:
        dst.write(cropped_data.astype(rasterio.float32), 1)


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
    labels: Annotated[
        str,
        typer.Argument(
            help="A comma separated list of labels that will be used to name the output files."
        ),
    ] = "",
) -> None:
    """
    Generates a FIM map for a specific HUC and nwm reach identifier using
    the provided flow rate. This assumes that a single flow rate is provided
    for each reach identifier.

    Arguments:
        huc_id - str: The HUC-8 identifier for the watershed.
        reach_ids - str: A comma separated list of NWM reach identifier for the reaches of interest.
        flow_rates - str: A comma replace list of flow rates corresponding to the reach_ids to use for FIM generation, in cubic meters per second.
        labels - str: A comma separated list of labels that will be used to name the output files.
    Returns:
        None

    """

    # parse reach_ids and flow_rates
    r_ids = reach_ids.split(",")
    output_labels = labels.split(",") if labels else []
    f_rates = [float(x) for x in flow_rates.split(",")]

    # download HUC data if it doesn't exist
    __download_huc_fim(huc_id)

    # generate output file names if not provided
    if len(output_labels) == 0:
        output_labels = [f"flowrate_{r_id}" for r_id in r_ids]

    # write the input files that will be used to generate the FIM
    flow_rate_filepaths = []
    for i in range(0, len(r_ids)):
        flow_rate_filepaths.append(
            __write_flow_input_file([r_ids[i]], [f_rates[i]], output_labels[i])
        )

    for i in range(0, len(flow_rate_filepaths)):
        # compute FIM using the moasic approach established
        # by NOAA OWP.
        __generate_fim(huc_id, flow_rate_filepaths[i])

        # clean the geotiff that was created by replacing
        # all values less than or equal to 0 with 0 and all
        # others with 1
        __clean_fim_geotiff(
            Path(f"/home/output/flood_{huc_id}/{huc_id}_inundation")
            / f"{output_labels[i]}_inundation.tif"
        )


if __name__ == "__main__":
    app()
