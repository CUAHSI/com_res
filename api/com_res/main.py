from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.fim import router as fim_router
from app.routers.timeseries import router as timeseries_router
from app.users import cuahsi_oauth_client
from config import get_settings

# TODO: get oauth working with swagger/redoc
# Setting the base url for swagger docs
# https://github.com/tiangolo/fastapi/pull/1547
# https://swagger.io/docs/specification/api-host-and-base-path/
# https://fastapi.tiangolo.com/how-to/configure-swagger-ui/
# https://github.com/tiangolo/fastapi/pull/499
swagger_params = {
    "withCredentials": True,
    "oauth2RedirectUrl": cuahsi_oauth_client.authorize_endpoint,
    "swagger_ui_client_id": cuahsi_oauth_client.client_id,
}


app = FastAPI(
    servers=[{"url": get_settings().vite_app_api_url}],
    swagger_ui_parameters=swagger_params,
)

origins_from_settings = get_settings().allow_origins

if origins_from_settings is None:
    origins_from_settings = ".*"

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origins_from_settings,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    timeseries_router,
    tags=["timeseries"],
)

app.include_router(
    fim_router,
    tags=["fim"],
)
