"""
Tests for Tier 1 -- surface-level feature extraction.

Validates sentence length computation, punctuation density detection,
and the empty-text edge case.
"""

from feature_extraction.tokenizer import process
from feature_extraction.tier1_surface import extract_surface


def test_sentence_length():
    """Two non-empty sentences should yield a positive average sentence length."""
    assert extract_surface(process("Hello world. This is a test."))["avg_sentence_length"] > 0


def test_punctuation_density():
    """Text with commas, question marks, and exclamation marks should detect all three."""
    f = extract_surface(process("Wow! Really? Yes, really!"))
    assert f["exclamation_density"] > 0 and f["question_mark_density"] > 0 and f["comma_density"] > 0


def test_empty_text():
    """Empty string should return all zeros without raising errors."""
    assert extract_surface(process(""))["avg_sentence_length"] == 0.0
