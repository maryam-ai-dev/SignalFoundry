import os

import redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.connectors import router as connectors_router
from app.api.generation import router as generation_router
from app.api.jobs import router as jobs_router
from app.api.retrieval import router as retrieval_router
from app.api.voice import router as voice_router
from app.shared.database import SessionLocal

app = FastAPI(title="python-ai-service", version="0.1.0")
app.include_router(jobs_router)
app.include_router(generation_router)
app.include_router(connectors_router)
app.include_router(voice_router)
app.include_router(retrieval_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": True, "message": str(exc)},
    )


@app.get("/health")
async def health():
    return {"status": "UP", "service": "python-ai-service"}


@app.get("/internal/status")
async def internal_status():
    db_status = "error"
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
            db_status = "ok"
    except Exception:
        pass

    redis_status = "error"
    try:
        r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        if r.ping():
            redis_status = "ok"
    except Exception:
        pass

    return {"db": db_status, "redis": redis_status}
