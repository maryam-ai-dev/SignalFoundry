"""Voice profile builder — averages sample vectors and computes maturity."""

from app.voice.stylometry.feature_extraction.schema import FEATURE_ORDER
from app.voice.stylometry.models import StyleFeatureVector


def build_profile(sample_vectors: list[StyleFeatureVector]) -> StyleFeatureVector:
    """Average multiple sample vectors into a single profile vector (field-wise mean)."""
    if not sample_vectors:
        return StyleFeatureVector()

    n = len(sample_vectors)
    averaged = {}
    for feature in FEATURE_ORDER:
        total = sum(sv.features.get(feature, 0.0) for sv in sample_vectors)
        averaged[feature] = total / n

    total_words = sum(sv.word_count for sv in sample_vectors)
    return StyleFeatureVector.from_features(averaged, total_words)


def compute_maturity(accepted_count: int, total_word_count: int) -> float:
    """Compute profile maturity score (0.0 to 1.0).

    Milestones:
        0 samples → 0.0
        1 sample  → 0.3
        2 samples + 500 words → 0.6
        5 samples + 2000 words → 1.0
    Linear interpolation between steps.
    """
    if accepted_count == 0:
        return 0.0

    # Sample-based progress (0 → 0.0, 1 → 0.3, 2 → 0.6, 5 → 1.0)
    if accepted_count >= 5:
        sample_score = 1.0
    elif accepted_count >= 2:
        sample_score = 0.6 + 0.4 * (accepted_count - 2) / 3
    else:
        sample_score = 0.3 * accepted_count

    # Word-based progress (0 → 0.0, 500 → 0.6, 2000 → 1.0)
    if total_word_count >= 2000:
        word_score = 1.0
    elif total_word_count >= 500:
        word_score = 0.6 + 0.4 * (total_word_count - 500) / 1500
    else:
        word_score = 0.6 * total_word_count / 500

    # Combined: take the lower of the two (both must progress)
    return round(min(sample_score, word_score), 3)


def should_accept_sample(quality_score: float) -> bool:
    """Reject samples with quality score below 0.4."""
    return quality_score >= 0.4
