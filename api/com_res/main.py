from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.fim import router as fim_router
from app.routers.timeseries import router as timeseries_router
from config import get_settings

app = FastAPI(
    servers=[{"url": get_settings().vite_app_api_url}],
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
    prefix="/timeseries",
)

app.include_router(
    fim_router,
    tags=["fim"],
)
