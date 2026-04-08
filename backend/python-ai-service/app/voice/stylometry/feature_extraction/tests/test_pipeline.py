"""
Tests for the end-to-end feature extraction pipeline.

Validates that the pipeline produces exactly 47 non-negative float features
in the canonical order defined by FEATURE_ORDER, and that specific features
(e.g., character tri-grams) are correctly populated for known inputs.
"""

from feature_extraction.pipeline import extract_features
from feature_extraction.schema import FEATURE_ORDER


def test_returns_all_47_features():
    """Pipeline must return exactly 47 features, all floats, matching the schema."""
    features = extract_features("I have been thinking about architecture and how systems evolve over time.")
    assert len(features) == 47
    for key in FEATURE_ORDER:
        assert key in features and isinstance(features[key], float)


def test_all_values_non_negative():
    """All feature values should be >= 0 (ratios and frequencies cannot be negative)."""
    for key, value in extract_features("Writing style analysis is an interesting research area.").items():
        assert value >= 0.0, f"{key} is negative: {value}"


def test_trigrams_present():
    """Text containing 'the' multiple times should yield a non-zero trigram_the feature."""
    assert extract_features("The thing about engineering is that the solutions are never simple.")["trigram_the"] > 0
