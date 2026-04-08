import os

import httpx

from app.workers.celery_app import celery_app

SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8080")


@celery_app.task(name="research_scan")
def run_research_scan(payload: dict) -> dict:
    """Stub task — calls Spring callbacks for analysis then generation.
    Real implementation chains scan → embed → analysis → generation in Phase 4+.
    """
    job_id = payload.get("job_id")
    if not job_id:
        return {"status": "error", "message": "no job_id in payload"}

    try:
        # Analysis callback (intermediate — does not mark job succeeded)
        httpx.post(
            f"{SPRING_URL}/api/internal/jobs/{job_id}/complete",
            json={
                "stage": "analysis",
                "finalStage": False,
                "result": {},
            },
            timeout=10,
        )

        # Generation callback (final stage — marks job succeeded)
        httpx.post(
            f"{SPRING_URL}/api/internal/jobs/{job_id}/complete",
            json={
                "stage": "generation",
                "finalStage": True,
                "result": {},
            },
            timeout=10,
        )
        return {"status": "ok"}
    except Exception as exc:
        try:
            httpx.post(
                f"{SPRING_URL}/api/internal/jobs/{job_id}/fail",
                json={"error": str(exc)},
                timeout=10,
            )
        except Exception:
            pass
        return {"status": "error", "message": str(exc)}
