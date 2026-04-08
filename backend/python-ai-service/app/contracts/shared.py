from pydantic import BaseModel


class GoalContext(BaseModel):
    goal_type: str
    target_audience: str | None = None
    desired_action: str | None = None
    cta_style: str | None = None
    tone_guidance: str | None = None
