"""Opportunity ranker — sorts insights by weighted score using DecisioningConfig."""

from app.decisioning.goal_router import DecisioningConfig


def rank_insights(insights: list[dict], config: DecisioningConfig) -> list[dict]:
    """Score and sort insights by weighted combination of relevance, recency, discussion."""
    if not insights:
        return []

    scored = []
    for insight in insights:
        relevance = insight.get("relevance_score", 0.0)
        recency = insight.get("recency_score", 0.0)
        discussion = insight.get("discussion_score", 0.0)

        weighted_score = (
            config.relevance_weight * relevance
            + config.recency_weight * recency
            + config.discussion_weight * discussion
        )

        # Boost priority signal types
        insight_type = insight.get("type", "")
        if config.priority_signal_types and insight_type in config.priority_signal_types:
            weighted_score *= 1.25

        insight_copy = dict(insight)
        insight_copy["weighted_score"] = round(weighted_score, 4)
        scored.append(insight_copy)

    scored.sort(key=lambda x: x["weighted_score"], reverse=True)
    return scored
