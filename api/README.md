# FloodSavvy API

FastAPI service for FloodSavvy data endpoints.

## Active Routers

The deployment now includes only the routers mounted in `com_res/main.py`:

- `timeseries` (`/timeseries/*`): National Water Model historical/forecast utilities.
- `fim` (`/fim` and `/historical-quantiles`): flood inundation mapping and quantile lookups.

## Runtime Configuration

Required environment variables:

- `VITE_APP_API_URL`
- `ALLOW_ORIGINS`
- `NWM_BIGQUERY_KEY`
- `NWM_BIGQUERY_URL`
- `GOOGLE_APPLICATION_CREDENTIALS_PATH` (optional, for explicit service account key path)

## Local Run

From this `api` directory:

```bash
pip install -r requirements.txt
uvicorn --host 0.0.0.0 --port 8000 --proxy-headers main:app
```

Or use the repository-level `docker-compose.yml` to run the API container (non-debug runtime).
