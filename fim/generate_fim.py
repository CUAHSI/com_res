#!/usr/bin/env python3

import typer
import fimserve as fm
from fimserve import runFIM
from typing import List
from pathlib import Path
from typing_extensions import Annotated

app = typer.Typer()


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

    # write the input files that will be used to generate the FIM
    flow_rate_filepaths = []
    for i in range(0, len(r_ids)):
        if len(output_labels) == 0:
            # generate label from reach id
            label = f"flowrate_{r_ids[i]}"
        else:
            label = output_labels[i]

        flow_rate_filepaths.append(
            __write_flow_input_file([r_ids[i]], [f_rates[i]], label)
        )

    for i in range(0, len(flow_rate_filepaths)):
        __generate_fim(huc_id, flow_rate_filepaths[i])


if __name__ == "__main__":
    app()
