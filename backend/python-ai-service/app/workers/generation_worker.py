import logging
import os

import httpx

from app.generation.angles.angle_engine import generate_angles
from app.generation.hooks.hook_engine import generate_hooks
from app.generation.synthesis.synthesis_engine import synthesize
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8080")


@celery_app.task(name="run_generation")
def run_generation_task(payload: dict) -> dict:
    """Generate hooks, angles, and synthesis from analysis results.
    Sends Spring generation callback (finalStage=true).
    """
    job_id = payload.get("job_id")
    analysis_results = payload.get("analysis_results", {})
    workspace_context = payload.get("workspace_context", {})
    topic = payload.get("topic", "")

    try:
        pain_clusters = analysis_results.get("pain_clusters", [])
        objection_clusters = analysis_results.get("objection_clusters", [])
        narrative_clusters = analysis_results.get("narrative_clusters", [])

        signals = {
            "pain_clusters": pain_clusters,
            "objection_clusters": objection_clusters,
            "belief_gaps": analysis_results.get("belief_gaps", []),
        }

        synthesis_result = synthesize(
            pain_clusters=pain_clusters,
            objection_clusters=objection_clusters,
            narrative_clusters=narrative_clusters,
            workspace_context=workspace_context,
        )

        hooks = generate_hooks(
            topic=topic,
            pain_clusters=pain_clusters,
            narrative_clusters=narrative_clusters,
        )

        angles = generate_angles(
            topic=topic,
            signals=signals,
            workspace_context=workspace_context,
        )

        result = {
            "synthesis": synthesis_result.model_dump(),
            "hooks": hooks,
            "angles": angles,
        }

        logger.info(
            "Generation complete: %d hooks, %d angles, summary %d chars",
            len(hooks), len(angles), len(synthesis_result.summary),
        )

        # Send generation callback (finalStage=true)
        if job_id:
            httpx.post(
                f"{SPRING_URL}/api/internal/jobs/{job_id}/complete",
                json={"stage": "generation", "finalStage": True, "result": result},
                timeout=15,
            )

        return result

    except Exception as exc:
        logger.error("Generation failed for job %s: %s", job_id, exc)
        if job_id:
            try:
                httpx.post(
                    f"{SPRING_URL}/api/internal/jobs/{job_id}/fail",
                    json={"error": str(exc)},
                    timeout=10,
                )
            except Exception:
                pass
        raise
