# Terraform: Cloud Run deployment (frontend + API)

This Terraform config deploys the FloodSavvy frontend and API as two Cloud Run services.

## What it creates

- Cloud Run service for API
- Cloud Run service for frontend
- API runtime service account
- API IAM roles for BigQuery query access (`roles/bigquery.jobUser`, `roles/bigquery.dataViewer`)
- Optional public invoker access (`allUsers`) per service
- Required API enablement (`run.googleapis.com`, `iam.googleapis.com`, `artifactregistry.googleapis.com`)

## Prerequisites

1. Terraform >= 1.6
2. gcloud authenticated to your target project
3. Docker images built and pushed to Artifact Registry (or another registry reachable by Cloud Run)

## Build and push images

From repository root, update names as needed:

```bash
PROJECT_ID=floodsavvy
REGION=us-central1
REPO=floodsavvy

# One-time repository create (if needed)
gcloud artifacts repositories create "$REPO" \
  --project "$PROJECT_ID" \
  --repository-format docker \
  --location "$REGION"

gcloud auth configure-docker "$REGION-docker.pkg.dev"

# API
cd api
docker build -t "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/floodsavvy-api:latest" .
docker push "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/floodsavvy-api:latest"

# Frontend
cd ../frontend
docker build -t "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/floodsavvy-frontend:latest" .
docker push "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/floodsavvy-frontend:latest"
```

## Deploy with Terraform

```bash
cd terraform/cloud-run
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars

terraform init
terraform plan
terraform apply
```

## Notes

- The frontend gets `VITE_APP_API_URL` from the deployed API URL automatically.
- The API uses a dedicated runtime service account and ADC by default.
- If you do not want public services, set:
  - `allow_unauthenticated_api = false`
  - `allow_unauthenticated_frontend = false`
