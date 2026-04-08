"""Confidence engine — combines match score and profile maturity into a level."""


def compute_confidence(match_score: float, profile_maturity: float) -> dict:
    """Compute confidence level from match score and profile maturity.

    HIGH:   both > 0.7
    MEDIUM: both > 0.4
    LOW:    either < 0.4
    """
    if match_score < 0.4 or profile_maturity < 0.4:
        return {"level": "LOW", "requires_review": True}

    if match_score > 0.7 and profile_maturity > 0.7:
        return {"level": "HIGH", "requires_review": False}

    return {"level": "MEDIUM", "requires_review": False}
