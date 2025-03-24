import pulumi
import pulumi_gcp as gcp
from pulumi import Config

config = Config()

gh_string = Config("github").require("repo"),  # Format: user/repo
branch = Config("github").require("branch")
instance = Config().require("instance")

github_org = gh_string[0].split("/")[0]
github_repo = gh_string[0].split("/")[1]
bucket_name = f"{instance}-static-bucket"

pulumi.export("bucket_name", bucket_name)
pulumi.export("github_repo", github_repo)
pulumi.export("branch", branch)

# Create a DNS managed zone
managed_zone = gcp.dns.ManagedZone("cuahsi-io",
                                   dns_name="cuahsi.io.",
                                   description="Managed zone for cuahsi.io",
                                   )

# Static website bucket
bucket = gcp.storage.Bucket(bucket_name,
                            location="US",
                            website=gcp.storage.BucketWebsiteArgs(
                                main_page_suffix="index.html",
                                not_found_page="404.html"
                            )
                            )

# Bucket IAM Policy (Public Read)
bucket_iam_binding = gcp.storage.BucketIAMBinding("bucket-iam-binding",
                                                  bucket=bucket.name,
                                                  role="roles/storage.objectViewer",
                                                  members=["allUsers"]
                                                  )

# Cloud Run for FastAPI backend
backend_service = gcp.cloudrun.Service(f"comres-back-{instance}",
                                       location="us-central1",
                                       template=gcp.cloudrun.ServiceTemplateArgs(
                                           spec=gcp.cloudrun.ServiceTemplateSpecArgs(
                                               containers=[gcp.cloudrun.ServiceTemplateSpecContainerArgs(
                                                   image="gcr.io/cloudrun/hello",  # replace with your fastapi container image
                                                   envs=[
                                                       gcp.cloudrun.ServiceTemplateSpecContainerEnvArgs(
                                                           name="FASTAPI_ENV_VAR",
                                                           value="example_value"
                                                       )
                                                   ]
                                               )]
                                           )
                                       )
                                       )

# Cloud Run IAM Policy
backend_iam = gcp.cloudrun.IamMember("backend-iam",
                                     service=backend_service.name,
                                     location=backend_service.location,
                                     role="roles/run.invoker",
                                     member="allUsers"
                                     )

# Managed SSL Certificate
certificate = gcp.certificatemanager.Certificate(f"com-res-{instance}-cert",
                                                 managed=gcp.certificatemanager.CertificateManagedArgs(
                                                     domains=[
                                                         f"com-res-{instance}.cuahsi.io"]
                                                 )
                                                 )

# Backend Cloud Build Trigger
trigger = gcp.cloudbuild.Trigger(
    "githubPushTrigger",
    name=f"com-res-{instance}-back-trigger",
    description="Trigger builds backend on push to main branch of CUAHSI/com_res",
    github={
        "name": "com_res",
        "owner": "CUAHSI",
        "push": {
            "branch": "main",
        },
    },
    build={
        "steps": [
            {
                "name": "gcr.io/cloud-builders/docker",
                "args": ["build", "-t", "gcr.io/$PROJECT_ID/com_res:latest", "-f", "api/Dockerfile", "."],
            },
        ],
    },
)

# Export the trigger name and URL
pulumi.export("triggerName", trigger.name)
pulumi.export("triggerUrl", pulumi.Output.concat("https://console.cloud.google.com/cloud-build/triggers/edit/", trigger.name))

# get the domain name of the backend service
backend_domain = backend_service.statuses[0].url.apply(
    lambda url: url.replace("https://", ""))
pulumi.export("backend_domain", backend_domain)

# Create a DNS A record in the managed zone
dns_record = gcp.dns.RecordSet(f"com-res-{instance}-cuahsi-io",
                               managed_zone=managed_zone.name,
                               name=f"com-res-{instance}.cuahsi.io.",
                               type="CNAME",
                               ttl=300,
                               rrdatas=[backend_domain]
                               )

pulumi.export("bucket_url", pulumi.Output.concat(
    "http://storage.googleapis.com/", bucket.name))
pulumi.export("cloud_run_url", backend_service.statuses[0].url)
pulumi.export("name_servers", managed_zone.name_servers)
pulumi.export("certificate_id", certificate.id)
