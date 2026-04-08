"""
Tests for Tier 5 -- character tri-gram feature extraction.

Validates that known tri-grams ('the', 'ing') are detected in text
and that empty text returns zero frequencies.
"""

from feature_extraction.tier5_char_ngrams import extract_char_ngrams


def test_trigrams_detected():
    """Text containing 'the' and 'thing' should yield positive trigram_the and trigram_ing."""
    f = extract_char_ngrams("the thing about the engineering thing")
    assert f["trigram_the"] > 0 and f["trigram_ing"] > 0


def test_empty_text():
    """Empty string should return zero for all tri-gram features."""
    assert extract_char_ngrams("")["trigram_the"] == 0.0
