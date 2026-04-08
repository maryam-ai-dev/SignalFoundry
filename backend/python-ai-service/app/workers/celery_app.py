import os

from celery import Celery

celery_app = Celery(
    "marketing_tool",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379"),
    include=["app.workers.test_task"],
)
