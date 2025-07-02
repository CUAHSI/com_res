from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from google.cloud import bigquery

router = APIRouter()


@router.get("/fim")
async def get_fim(
    reach_id: str = Query(..., description="The unique NWM reach identifier.", example="5984765"),
) -> JSONResponse:
    """
    Get FIM data for a given reach ID.

    Arguments:
    ==========
    reach_id: str - the NWM reach ID for which to collect data.


    Returns:
    ========
    JSONResponse: a dictionary containing the FIM data for the specified reach ID.
    """

    client = bigquery.Client(project="com-res")

    query = """
    SELECT *
    FROM `com-res.flood_data.fim_catalog`
    WHERE reach_id = @reach_id
    ORDER BY stage ASC
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("reach_id", "INT64", 8584970),
        ]
    )

    query_job = client.query(query, job_config=job_config)

    results = dict(files=[], flows_cms=[], stages_m=[])

    for row in query_job:
        results['files'].append(row[0])
        results['stages_m'].append(row[2])
        results['flows_cms'].append(row[3])

    return JSONResponse(content=results)
