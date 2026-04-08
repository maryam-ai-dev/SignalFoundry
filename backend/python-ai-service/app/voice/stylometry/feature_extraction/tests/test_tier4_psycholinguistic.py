"""
Tests for Tier 4 -- psycholinguistic feature extraction.

Validates that discourse markers (e.g., "However", "In fact") and
intensifiers (e.g., "really", "very", "extremely") are detected.
"""

from feature_extraction.tokenizer import process
from feature_extraction.tier4_psycholinguistic import extract_psycholinguistic


def test_discourse_markers():
    """Text with 'However' and 'In fact' should produce a positive discourse marker ratio."""
    assert extract_psycholinguistic(process("However, I think that this is actually quite important. In fact, it matters a lot."))["discourse_marker_ratio"] > 0


def test_intensifiers():
    """Text with 'really', 'very', 'extremely', 'absolutely' should produce a positive intensifier ratio."""
    assert extract_psycholinguistic(process("This is really very extremely important and I absolutely love it."))["intensifier_ratio"] > 0
