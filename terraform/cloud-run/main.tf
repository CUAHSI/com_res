resource "google_project_service" "required" {
  for_each = toset([
    "run.googleapis.com",
    "iam.googleapis.com",
    "artifactregistry.googleapis.com"
  ])

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

resource "google_service_account" "api" {
  account_id   = var.api_service_account_id
  display_name = "FloodSavvy API Cloud Run runtime"
  project      = var.project_id
}

resource "google_project_iam_member" "api_bigquery_job_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.api.email}"
}

resource "google_project_iam_member" "api_bigquery_data_viewer" {
  project = var.project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service" "api" {
  name     = var.api_service_name
  project  = var.project_id
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.api.email

    scaling {
      min_instance_count = var.api_min_instance_count
      max_instance_count = var.api_max_instance_count
    }

    containers {
      image = var.api_image

      ports {
        container_port = var.api_container_port
      }

      env {
        name  = "VITE_APP_API_URL"
        value = ""
      }

      env {
        name  = "ALLOW_ORIGINS"
        value = var.api_allow_origins
      }

      env {
        name  = "NWM_BIGQUERY_KEY"
        value = var.nwm_bigquery_key
      }

      env {
        name  = "NWM_BIGQUERY_URL"
        value = var.nwm_bigquery_url
      }

      env {
        name  = "BIGQUERY_PROJECT_ID"
        value = var.bigquery_project_id
      }

      env {
        name  = "CLOUD_RUN_REGION"
        value = var.cloud_run_region
      }

      env {
        name  = "CLOUD_RUN_JOB_NAME"
        value = var.cloud_run_job_name
      }

      env {
        name  = "GCS_BUCKET_NAME"
        value = var.gcs_bucket_name
      }

      env {
        name  = "GOOGLE_APPLICATION_CREDENTIALS_PATH"
        value = var.google_application_credentials_path
      }
    }
  }

  depends_on = [google_project_service.required]
}

resource "google_cloud_run_v2_service" "frontend" {
  name     = var.frontend_service_name
  project  = var.project_id
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = var.frontend_min_instance_count
      max_instance_count = var.frontend_max_instance_count
    }

    containers {
      image = var.frontend_image

      ports {
        container_port = var.frontend_container_port
      }

      env {
        name  = "VITE_APP_API_URL"
        value = google_cloud_run_v2_service.api.uri
      }

      env {
        name  = "VITE_APP_FULL_URL"
        value = var.frontend_vite_app_full_url != "" ? var.frontend_vite_app_full_url : "${google_cloud_run_v2_service.frontend.uri}/"
      }

      env {
        name  = "VITE_APP_BASE"
        value = var.frontend_vite_app_base
      }
    }
  }

  depends_on = [google_project_service.required]
}

resource "google_cloud_run_v2_service_iam_member" "api_public_invoker" {
  count    = var.allow_unauthenticated_api ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public_invoker" {
  count    = var.allow_unauthenticated_frontend ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
