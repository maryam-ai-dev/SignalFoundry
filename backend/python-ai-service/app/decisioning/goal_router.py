"""Goal router — returns scoring weights based on scan mode and campaign goal."""

from pydantic import BaseModel


class DecisioningConfig(BaseModel):
    relevance_weight: float
    recency_weight: float
    discussion_weight: float
    priority_signal_types: list[str]


_GENERAL_CONFIG = DecisioningConfig(
    relevance_weight=0.4,
    recency_weight=0.3,
    discussion_weight=0.3,
    priority_signal_types=[],
)


def get_config(mode: str, goal_context: dict | None = None) -> DecisioningConfig:
    if mode != "CAMPAIGN" or not goal_context:
        return _GENERAL_CONFIG

    goal_type = goal_context.get("goal_type", "")
    return _CAMPAIGN_CONFIGS.get(goal_type, _GENERAL_CONFIG)


# Campaign-specific configs added in Sprint 13.7
_CAMPAIGN_CONFIGS: dict[str, DecisioningConfig] = {}
