#!/usr/bin/env python3

"""
The purpose of this script is to compute flow rate
increments to generate FIM using reach rating
curves.
"""

import typer
import numpy
import pandas
from pathlib import Path
from typing import Tuple, Union
from scipy import interpolate

app = typer.Typer()


def interpolate_y(
    df: pandas.DataFrame, x_column: str, y_column: str, x_value: float
) -> float:
    """
    Performs 1D interpolation on two columns of a Dataframe.

    Parameters
    ==========
    df: pandas.DataFrame
        DataFrame containing data that will be used in the interpolation.
    x_column: str
        Name of the column that represents the X-axis data.
    y_column: str
        Name of the column that represents the Y-axis data.
    x_value: float
        Numeric X-axis value for which to interpolate Y-axis data. Returns
        -9999 if the interpolation fails to resolve.

    Returns
    =======
    y_value: float
        Numeric Y-axis value corresponding to the input X-axis value.

    """
    # Sort the DataFrame by the 'x' column to ensure interpolation works correctly
    df_sorted = df.sort_values(by=x_column)

    # Check if the x_value is within the range of the DataFrame
    if x_value < df_sorted[x_column].min() or x_value > df_sorted[x_column].max():
        return -9999  # x_value is out of range, cannot interpolate

    # Perform linear interpolation
    f = interpolate.interp1d(df_sorted[x_column], df_sorted[y_column], kind="linear")

    # Return the interpolated y value for the given x value
    return f(x_value).item()


def __load_rating_curve(huc_id: str, reach_id: str) -> Union[pandas.DataFrame, None]:

    # create the path to the rating curve file
    # based on the huc_id. This assumes that the
    # data has already been downloaded.
    huc_data_path = Path(f"output/flood_{huc_id}/{huc_id}/branches/0")

    # load the rating curve data
    df = pandas.read_csv(huc_data_path / "hydrotable_0.csv", low_memory=False)
    dat = df.loc[df.feature_id == int(reach_id)]

    # exit early if no data is found for the reach
    if len(dat) == 0:
        print(f"No data found for reach_id: {reach_id}")
        return None

    # isolate only the data that we need
    dat = dat[["stage", "discharge_cms", "HydroID"]]

    return dat


@app.command(name="get_stage")
def get_stage(
    huc_id: str, reach_id: str, flow: float, verbose: bool = False
) -> Union[float, None]:
    """
    Interpolates river stage based on user-provided river flow using the
    synthetically generated rating curve for the specified reach.
    """

    dat = __load_rating_curve(huc_id, reach_id)
    if dat is None:
        return

    # since each feature_id is associated with multiple HydroID's,
    # we'll just consider the first one to determine the bounds of
    # our calculation
    group = dat.groupby("HydroID").get_group(
        list(dat.groupby("HydroID").groups.keys())[0]
    )

    interpolated_stage = interpolate_y(group, "discharge_cms", "stage", flow)

    if verbose:
        print(f"HUC ID: {huc_id}")
        print(f"Reach ID: {reach_id}")
        print("-----------")
        print(
            f"{flow} cms -> {round(interpolated_stage, 2)} m ({interpolated_stage} m )"
        )

    return interpolated_stage


@app.command(name="get_flow")
def get_flow(
    huc_id: str, reach_id: str, stage: float, verbose: bool = False
) -> Union[float, None]:
    """
    Interpolates river flow based on user-provided river stage using the
    synthetically generated rating curve for the specified reach.
    """

    dat = __load_rating_curve(huc_id, reach_id)
    if dat is None:
        return

    # since each feature_id is associated with multiple HydroID's,
    # we'll just consider the first one to determine the bounds of
    # our calculation
    group = dat.groupby("HydroID").get_group(
        list(dat.groupby("HydroID").groups.keys())[0]
    )

    interpolated_flow = interpolate_y(group, "stage", "discharge_cms", stage)

    if verbose:
        print(f"HUC ID: {huc_id}")
        print(f"Reach ID: {reach_id}")
        print("-----------")
        print(
            f"{stage} m -> {round(interpolated_flow, 2)} cms ({interpolated_flow} cms)"
        )

    return interpolated_flow


@app.command(name="get_rating_increments")
def compute_rating_increments(
    huc_id: str,
    reach_id: str,
    increment: float,
    verbose: bool = False,
) -> Tuple[Tuple[float], Tuple[float]]:
    """
    Compute flow rate increments for a given reach ID
    and rating curve file.

    Arguments:
    huc_id: str - HUC ID of the reach
    reach_id: str - Reach ID of the reach
    increment: float - Increment value in meters

    """

    dat = __load_rating_curve(huc_id, reach_id)
    if dat is None:
        return

    # since each feature_id is associated with multiple HydroID's,
    # we'll just consider the first one to determine the bounds of
    # our calculation
    group = dat.groupby("HydroID").get_group(
        list(dat.groupby("HydroID").groups.keys())[0]
    )

    # get the min and max stage to set the upper and lower bounds
    # of our search extent
    stage_list = numpy.arange(group.stage.min(), group.stage.max(), increment)

    interpolated = []
    for s in stage_list:
        interpolated_flow = interpolate_y(group, "stage", "discharge_cms", s)

        interpolated.append((round(s, 2), round(interpolated_flow, 2)))

    if verbose:
        print(f"HUC ID: {huc_id}")
        print(f"Reach ID: {reach_id}")
        print(f"Increment: {increment}")
        print("-----------")
        for i in interpolated:
            print(f"{i[0]}, {i[1]}")

    interpolated_stage, interpolated_flow = zip(*interpolated)

    return interpolated_stage, interpolated_flow


if __name__ == "__main__":
    app()
