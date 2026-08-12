variable "project_id" {
  description = "Google Cloud project ID where resources are created."
  type        = floodsavvy
}

variable "region" {
  description = "Region for Cloud Run services."
  type        = string
  default     = "us-central1"
}

variable "api_service_name" {
  description = "Cloud Run service name for the API."
  type        = string
  default     = "floodsavvy-api"
}

variable "frontend_service_name" {
  description = "Cloud Run service name for the frontend."
  type        = string
  default     = "floodsavvy-front"
}

variable "api_image" {
  description = "Fully-qualified container image URL for the API service."
  type        = string
}

variable "frontend_image" {
  description = "Fully-qualified container image URL for the frontend service."
  type        = string
}

variable "allow_unauthenticated_api" {
  description = "If true, allows public invocation of the API Cloud Run service."
  type        = bool
  default     = true
}

variable "allow_unauthenticated_frontend" {
  description = "If true, allows public invocation of the frontend Cloud Run service."
  type        = bool
  default     = true
}

variable "api_max_instance_count" {
  description = "Maximum number of instances for API service autoscaling."
  type        = number
  default     = 10
}

variable "api_min_instance_count" {
  description = "Minimum number of instances for API service autoscaling."
  type        = number
  default     = 0
}

variable "frontend_max_instance_count" {
  description = "Maximum number of instances for frontend service autoscaling."
  type        = number
  default     = 10
}

variable "frontend_min_instance_count" {
  description = "Minimum number of instances for frontend service autoscaling."
  type        = number
  default     = 0
}

variable "api_container_port" {
  description = "Container port exposed by the API image."
  type        = number
  default     = 8000
}

variable "frontend_container_port" {
  description = "Container port exposed by the frontend image."
  type        = number
  default     = 8080
}

variable "api_allow_origins" {
  description = "Value for API ALLOW_ORIGINS environment variable."
  type        = string
  default     = ".*"
}

variable "nwm_bigquery_key" {
  description = "Value for API NWM_BIGQUERY_KEY environment variable."
  type        = string
  sensitive   = true
}

variable "nwm_bigquery_url" {
  description = "Value for API NWM_BIGQUERY_URL environment variable."
  type        = string
  default     = "https://nwm-api.ciroh.org"
}

variable "bigquery_project_id" {
  description = "Value for API BIGQUERY_PROJECT_ID environment variable."
  type        = string
}

variable "cloud_run_region" {
  description = "Value for API CLOUD_RUN_REGION environment variable."
  type        = string
  default     = "us-central1"
}

variable "cloud_run_job_name" {
  description = "Value for API CLOUD_RUN_JOB_NAME environment variable."
  type        = string
  default     = "fimserv"
}

variable "gcs_bucket_name" {
  description = "Value for API GCS_BUCKET_NAME environment variable."
  type        = string
}

variable "google_application_credentials_path" {
  description = "Optional API GOOGLE_APPLICATION_CREDENTIALS_PATH value; leave empty to use ADC."
  type        = string
  default     = ""
}

variable "frontend_vite_app_base" {
  description = "Value for frontend VITE_APP_BASE environment variable."
  type        = string
  default     = "/"
}

variable "frontend_vite_app_full_url" {
  description = "Value for frontend VITE_APP_FULL_URL environment variable."
  type        = string
  default     = ""
}

variable "api_service_account_id" {
  description = "Account ID for the API runtime service account."
  type        = string
  default     = "floodsavvy-api-runner"
}
