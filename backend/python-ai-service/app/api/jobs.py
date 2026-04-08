from celery.result import AsyncResult
from fastapi import APIRouter
from pydantic import BaseModel

from app.workers.celery_app import celery_app
from app.workers.research_scan_worker import run_research_scan

router = APIRouter()

TASK_ROUTING = {
    "RESEARCH_SCAN": run_research_scan,
}


class EnqueueJobRequest(BaseModel):
    type: str
    payload: dict = {}


@router.post("/internal/jobs/enqueue")
async def enqueue_job(body: EnqueueJobRequest):
    task_fn = TASK_ROUTING.get(body.type)
    if task_fn is None:
        return {"error": True, "message": f"Unknown job type: {body.type}"}

    result = task_fn.delay(body.payload)
    return {"celery_task_id": result.id}


@router.get("/internal/jobs/status/{task_id}")
async def job_status(task_id: str):
    result = AsyncResult(task_id, app=celery_app)
    return {"status": result.status, "result": result.result if result.ready() else None}
