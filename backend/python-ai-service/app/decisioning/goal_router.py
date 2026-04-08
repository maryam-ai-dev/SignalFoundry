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


_CAMPAIGN_CONFIGS: dict[str, DecisioningConfig] = {
    "BETA_USER_ACQUISITION": DecisioningConfig(
        relevance_weight=0.5, recency_weight=0.3, discussion_weight=0.2,
        priority_signal_types=["PAIN", "OBJECTION"],
    ),
    "WAITLIST_GROWTH": DecisioningConfig(
        relevance_weight=0.5, recency_weight=0.3, discussion_weight=0.2,
        priority_signal_types=["PAIN", "BELIEF_GAP"],
    ),
    "AWARENESS": DecisioningConfig(
        relevance_weight=0.3, recency_weight=0.4, discussion_weight=0.3,
        priority_signal_types=["NARRATIVE"],
    ),
    "CREATOR_RECRUITMENT": DecisioningConfig(
        relevance_weight=0.4, recency_weight=0.3, discussion_weight=0.3,
        priority_signal_types=["LANGUAGE", "NARRATIVE"],
    ),
    "OBJECTION_TESTING": DecisioningConfig(
        relevance_weight=0.3, recency_weight=0.2, discussion_weight=0.5,
        priority_signal_types=["OBJECTION"],
    ),
    "FEATURE_VALIDATION": DecisioningConfig(
        relevance_weight=0.5, recency_weight=0.2, discussion_weight=0.3,
        priority_signal_types=["PAIN", "BELIEF_GAP"],
    ),
}
