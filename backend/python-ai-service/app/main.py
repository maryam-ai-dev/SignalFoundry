import os

import redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="python-ai-service", version="0.1.0")

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
    redis_status = "error"
    try:
        r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        if r.ping():
            redis_status = "ok"
    except Exception:
        pass
    return {"db": "pending", "redis": redis_status}
