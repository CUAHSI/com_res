from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# had to use load_dotenv() to get the env variables to work during testing
load_dotenv()


class Settings(BaseSettings):
    vite_app_api_url: str
    allow_origins: str

    nwm_bigquery_key: str
    nwm_bigquery_url: str
    bigquery_project_id: str = "com-res"
    cloud_run_region: str = "us-central1"
    cloud_run_job_name: str = "fimserv"
    gcs_bucket_name: str = "com_res_fim_output"

    google_application_credentials_path: str = ""


@lru_cache()
def get_settings() -> Settings:
    return Settings()
