"""CTA selector — picks appropriate call-to-action based on campaign goal and workspace settings."""


def select_cta(goal_context: dict | None, allow_direct_cta: bool = True) -> str:
    """Select CTA type based on campaign goal.

    Returns one of: NONE, SOFT_INTEREST, COMMENT_FOR_ACCESS, DM_FOR_BETA
    If allow_direct_cta=False, only NONE or SOFT_INTEREST are returned.
    """
    if not goal_context:
        return "NONE"

    goal_type = goal_context.get("goal_type", "")

    # Map goal types to CTA intensity
    cta_map = {
        "BETA_USER_ACQUISITION": "DM_FOR_BETA",
        "WAITLIST_GROWTH": "COMMENT_FOR_ACCESS",
        "AWARENESS": "NONE",
        "CREATOR_RECRUITMENT": "SOFT_INTEREST",
        "OBJECTION_TESTING": "NONE",
        "FEATURE_VALIDATION": "SOFT_INTEREST",
    }

    cta = cta_map.get(goal_type, "NONE")

    # Enforce workspace policy
    if not allow_direct_cta and cta in ("COMMENT_FOR_ACCESS", "DM_FOR_BETA"):
        return "SOFT_INTEREST"

    return cta
