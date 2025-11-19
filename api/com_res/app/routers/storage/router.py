from fastapi import APIRouter, Depends

from app.db import User
from app.models import WorkflowDep
from app.users import current_active_user
from config import get_minio_client

router = APIRouter()


@router.get('/presigned/get/{workflow_id}', description="Create a download url")
async def presigned_get_minio(workflow_params: WorkflowDep, user: User = Depends(current_active_user)):
    submission = workflow_params.user.get_submission(workflow_params.workflow_id)
    url = get_minio_client().presigned_get_object("com_res-outputs", submission.output_path(user.bucket_name))
    return {'url': url}


@router.get('/url/{workflow_id}', description="Create a download url")
async def presigned_get_url(workflow_params: WorkflowDep, user: User = Depends(current_active_user)):
    submission = workflow_params.user.get_submission(workflow_params.workflow_id)
    url = get_minio_client().presigned_get_object("com_res-outputs", submission.output_path(user.bucket_name))
    return {'url': url}


@router.get('/presigned/put/{bucket}', description="Create a PUT file presigned url")
async def presigned_put_minio(bucket: str, path: str):
    url = get_minio_client().presigned_put_object(bucket, path)
    return {'url': url}
