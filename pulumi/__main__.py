import pulumi
import pulumi_gcp as gcp
from pulumi import Config
import os

# Read environment variables from ../.env file
# do this without dotenv
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
env_vars = []
with open(dotenv_path) as f:
    for line in f:
        try:
            key, value = line.strip().split("=")
            env_vars.append({"name": key, "value": value})
        except ValueError:
            pass

config = Config()

gh_string = Config("github").require("repo"),  # Format: user/repo
branch = Config("github").require("branch")
instance = Config().require("instance")

github_org = gh_string[0].split("/")[0]
github_repo = gh_string[0].split("/")[1]
bucket_name = f"com-res-{instance}-bucket"

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
        not_found_page="404.html",
    ),
    cors=[
        gcp.storage.BucketCorArgs(
            methods=["GET"],
            origins=["*"],
            response_headers=["*"],
        ),
    ]
)


# Function to upload all files from a directory to the GCP bucket
def upload_directory_to_bucket(directory, bucket_name):
    objects = []
    for root, _, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, directory)
            bucket_object = gcp.storage.BucketObject(
                relative_path,
                bucket=bucket_name,
                source=pulumi.FileAsset(file_path),
                name=relative_path
            )
            objects.append(bucket_object)
    return objects


# Upload the contents of the frontend/dist directory to the bucket
frontend_dist_directory = "../frontend/dist"
bucket_objects = upload_directory_to_bucket(frontend_dist_directory, bucket.name)

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
                                                   image="us-central1-docker.pkg.dev/com-res/cloud-run-source-deploy/com_res/com-res-back-dev:006edc37c34ef04456370c5d975151478acb6212",
                                                   ports=[gcp.cloudrun.ServiceTemplateSpecContainerPortArgs(
                                                        container_port=8000
                                                    )],
                                                   envs=env_vars,
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
# trigger = gcp.cloudbuild.Trigger(
#     "githubPushTrigger",
#     name=f"com-res-{instance}-back-trigger",
#     description="Trigger builds backend on push to main branch of CUAHSI/com_res",
#     github={
#         "name": "com_res",
#         "owner": "CUAHSI",
#         "push": {
#             "branch": "main",
#         },
#     },
#     build={
#         "steps": [
#             {
#                 "name": "gcr.io/cloud-builders/docker",
#                 "args": ["build", "-t", "gcr.io/$PROJECT_ID/com_res:latest", "-f", "api/Dockerfile", "."],
#             },
#         ],
#     },
# )

# Export the trigger name and URL
# pulumi.export("triggerName", trigger.name)
# pulumi.export("triggerUrl", pulumi.Output.concat("https://console.cloud.google.com/cloud-build/triggers/edit/", trigger.name))

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
pulumi.export('bucket_url', pulumi.Output.concat('https://storage.googleapis.com/', bucket.name, '/index.html'))
