"""
Tests for Tier 2 -- lexical feature extraction.

Validates type-token ratio range, hapax legomena detection, and
contraction detection (present vs. absent).
"""

from feature_extraction.tokenizer import process
from feature_extraction.tier2_lexical import extract_lexical


def test_type_token_ratio():
    """Repeated words ('the the the cat cat dog') should yield TTR between 0.4 and 0.6."""
    assert 0.4 < extract_lexical(process("the the the cat cat dog"))["type_token_ratio"] < 0.6


def test_hapax():
    """All-unique words should give a hapax legomena ratio near 1.0."""
    assert extract_lexical(process("one two three four five six seven"))["hapax_legomena_ratio"] > 0.9


def test_contraction_ratio():
    """Contractions (don't, it's, can't) should register; expanded forms should not."""
    assert extract_lexical(process("I don't think it's correct and we can't do it"))["contraction_ratio"] > 0
    assert extract_lexical(process("I do not think it is correct and we cannot do it"))["contraction_ratio"] == 0.0
