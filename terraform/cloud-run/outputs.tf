output "api_service_url" {
  description = "Public URL of the API Cloud Run service."
  value       = google_cloud_run_v2_service.api.uri
}

output "frontend_service_url" {
  description = "Public URL of the frontend Cloud Run service."
  value       = google_cloud_run_v2_service.frontend.uri
}

output "api_service_account_email" {
  description = "Runtime service account used by the API service."
  value       = google_service_account.api.email
}
