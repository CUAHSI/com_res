import logging
import os

from fastapi import APIRouter, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from google.auth import default, exceptions
from google.cloud import bigquery

from config import get_settings

router = APIRouter()


def get_bigquery_client():
    """Helper function to create BigQuery client with flexible credential handling"""
    __settings = get_settings()

    # 1. First try explicit service account path if configured
    if hasattr(__settings, 'google_application_credentials_path'):
        credentials_path = __settings.google_application_credentials_path
        if credentials_path and os.path.exists(credentials_path):
            try:
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
                credentials, project = default()
                return bigquery.Client(credentials=credentials, project=project or "com-res")
            except Exception as e:
                logging.warning(f"GOOGLE_APPLICATION_CREDENTIALS auth failed: {e}")

    # 2. Try Application Default Credentials
    try:
        credentials, project = default()
        return bigquery.Client(credentials=credentials, project=project or "com-res")  # Fallback project
    except exceptions.DefaultCredentialsError as e:
        logging.error("No valid credentials found")
        raise HTTPException(status_code=500, detail=f"Could not authenticate with BigQuery credentials: {str(e)}")


router = APIRouter()


@router.get("/fim")
async def get_fim(
    reach_id: str = Query(..., description="The unique NWM reach identifier.", example="8584970"),
) -> JSONResponse:
    """
    Get FIM data for a given reach ID.

    Arguments:
    ==========
    reach_id: str - the NWM reach ID for which to collect data.


    Returns:
    ========
    JSONResponse: a dictionary containing the FIM data for the specified reach ID.

    Raises:
    =======
    HTTPException: if the BigQuery operation fails or if the reach ID is not found.
    """
    try:
        client = get_bigquery_client()

        query = """
        SELECT *
        FROM `com-res.flood_data.fim_catalog`
        WHERE reach_id = @reach_id
        ORDER BY stage ASC
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("reach_id", "INT64", reach_id),
            ]
        )

        query_job = client.query(query, job_config=job_config)

        results = dict(files=[], flows_cms=[], stages_m=[])

        for row in query_job:
            results['files'].append(row['public_url'])
            results['stages_m'].append(row['stage'])
            results['flows_cms'].append(row['flow'])

    except Exception as e:
        logging.error(f"Query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"BigQuery operation failed: {str(e)}")
    return JSONResponse(content=jsonable_encoder(results))
