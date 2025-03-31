from datetime import date
from .historical import AnalysisAssim

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/timeseries/nwm-historical")
async def get_historical_nwm(
    reach_id: str = Query(
        ..., description="The unique NWM reach identifier.", example="5984765"
    ),
    start_date: date = Query(
        ...,
        description="The start date for the data collectollection in YYYY-MM-DD format.",
        example="2024-10-01",
    ),
    end_date: date = Query(
        ...,
        description="The end date for the data collection in YYYY-MM-DD format.",
        example="2024-12-31",
    ),
    offset: int = Query(
        3,
        description="The simulation time offset, supported values are 1,2, and 3 (default: 3).",
        example="3",
    ),
) -> JSONResponse:
    """
    Collects historical NWM data for a given reach ID and time range.
    This uses the CIROH-hosted API for accessing Google BigQuery.

    Arguments:
    ==========
    reach_id: str - the NWM reach ID for which to collect data.
    start_date: datetime - the start date and time for the data collection.
    end_date: datetime - the end date and time for the data collection.
    offset: int - the analysis_assim result time offset. Supported values are 1, 2, and 3.


    Returns:
    ========
    JSONResponse: a dictionary containing the timeseries of data for the given reach during the given time period in the form {date: streamflow, ...}
    """

    # collect historical analysis and assimilation data
    adata = AnalysisAssim()
    st = start_date.strftime("%Y-%m-%d")
    et = end_date.strftime("%Y-%m-%d")
    adata.collect_analysis_assim([reach_id], st, et, offsets=str(offset))

    data = {
        time.strftime("%Y-%m-%d %H:%M:%S"): streamflow
        for time, streamflow in zip(adata.df["time"], adata.df["streamflow"])
    }

    return JSONResponse(content=data)
