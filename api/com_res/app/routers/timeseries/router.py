import logging
from datetime import date, datetime

from app.routers.fim.router import get_bigquery_client
from fastapi import APIRouter, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import HTMLResponse, JSONResponse

from google.cloud import bigquery

from .forecast import Forecasts, ForecastTypes
from .historical import AnalysisAssim

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/nwm-historical")
async def get_historical_nwm(
    reach_id: str = Query(..., description="The unique NWM reach identifier.", example="5984765"),
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


@router.get("/nwm-forecast")
async def get_forecast_nwm(
    reach_id: str = Query(..., description="The unique NWM reach identifier.", example="5984765"),
    date_time: datetime = Query(
        ...,
        description="The date and time to collect forecast data for in UTC, in theYYYY-MM-DD HH:MM:SS format.",
        example="2023-11-25 06:00:00",
    ),
    forecast: str = Query(
        ...,
        description="The forecast simulation to collect data for. Acceptable values include 'short_range', 'medium_range, or 'long_range'",
        example="medium_range",
    ),
    ensemble: str = Query(
        0,
        description="The model ensemble for which to collect data, acceptable values are dependent on the model forecast : short_range =[0], medium_range=[0, 1, 2, 3, 4, 5], long_range=[0, 1, 2, 3] (default: 0)",
        example="3",
    ),
) -> JSONResponse:
    """
    Collects forecasted NWM data for a given reach ID.
    This uses the CIROH-hosted API for accessing Google BigQuery.

    Arguments:
    ==========
    reach_id: str - the NWM reach ID for which to collect data.
    date_time: datetime - the date and time for the data collection.
    forecast: str - the forecast simulation for which to collect data.
    ensemble: str - the forecast ensemble member for which data will be collected.

    Returns:
    ========
    JSONResponse: a dictionary containing the timeseries of data for the given reach during the given time period in the form {date: streamflow, ...}
    """

    # collect historical analysis and assimilation data
    fdata = Forecasts()
    dt = date_time.strftime("%Y-%m-%d %H:%M:%S")

    try:
        ftype = ForecastTypes(forecast)
    except ValueError:
        error_message = (
            f'Invalid forecast type: {forecast}. Valid options are "short_range", "medium_range", or "long_range".'
        )
        return HTMLResponse(
            content=f"<h1>Error 404</h1><p>{error_message}</p>",
            status_code=404,
        )

    valid_ensemble = fdata.filter_forecast_ensembles(ftype, [int(ensemble)])
    if len(valid_ensemble) == 0:
        all_valid_ensembles = fdata.filter_forecast_ensembles(ftype)
        error_message = (
            f"Invalid ensemble member: {ensemble}. Valid options for {forecast} are {all_valid_ensembles}.",
        )
        return HTMLResponse(
            content=f"<h1>Error 404</h1><p>{error_message}</p>",
            status_code=404,
        )

    try:
        fdata.collect_forecasts([reach_id], ftype, [dt], valid_ensemble)
    except Exception as e:
        return HTMLResponse(
            content=f"<h1>Error 500</h1><p>Failed to fetch forecast data: {str(e)}</p>",
            status_code=404,
        )

    data = {
        time.strftime("%Y-%m-%d %H:%M:%S"): streamflow
        for time, streamflow in zip(fdata.df["time"], fdata.df["streamflow"])
    }

    return JSONResponse(content=data)


@router.get("/historical-quantiles")
async def get_quantiles(
    feature_id: int = Query(
        ...,
        description="The unique NWM feature identifier.",
        example=3627071,
    ),
) -> JSONResponse:
    """
    Get quantiles data for a given feature ID.

    Arguments:
    ==========
    feature_id: int - the NWM feature ID for which to collect quantiles data.

    Returns:
    ========
    JSONResponse:
    a dictionary containing the quantiles data for the specified feature ID.

    Raises:
    =======
    HTTPException:
    if the BigQuery operation fails or if the feature ID is not found.
    """
    try:
        client = get_bigquery_client()

        # TODO: revert to using feature_id once all data is loaded in BigQuery
        reachid = 3627071  # for testing purposes

        query = """
        SELECT *
        FROM `com-res.flood_data.quantiles_catalog`
        WHERE feature_id = @feature_id
        ORDER BY doy ASC
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter(
                    "feature_id", "INT64", reachid
                ),
            ]
        )

        query_job = client.query(query, job_config=job_config)

        results = []
        for row in query_job:
            results.append({
                "feature_id": row['feature_id'],
                "doy": row['doy'],
                "q0": row['q0'],
                "q5": row['q5'],
                "q10": row['q10'],
                "q25": row['q25'],
                "q75": row['q75'],
                "q90": row['q90'],
                "q100": row['q100']
            })

    except Exception as e:
        logging.error(f"Quantiles query failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"BigQuery operation failed: {str(e)}"
        )

    return JSONResponse(content=jsonable_encoder(results))
