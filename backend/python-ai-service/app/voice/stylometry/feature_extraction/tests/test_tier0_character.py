"""
Tests for Tier 0 -- character-level feature extraction.

Validates uppercase detection, digit counting, Shannon entropy ordering,
repeated-character detection, and the empty-text edge case.
"""

from feature_extraction.tier0_character import extract_character


def test_uppercase_ratio():
    """Capital letters in 'Hello World' should produce a positive uppercase ratio."""
    assert extract_character("Hello World")["uppercase_ratio"] > 0


def test_digit_ratio():
    """Digits embedded in text should be counted correctly."""
    assert extract_character("I have 3 cats and 2 dogs")["digit_ratio"] > 0


def test_char_entropy():
    """Diverse characters ('abcdefg') should have higher entropy than uniform ('aaaaaaa')."""
    assert extract_character("abcdefg")["char_entropy"] > extract_character("aaaaaaa")["char_entropy"]


def test_repeated_char_ratio():
    """Consecutive repeated characters like 'oo' and 'oo' should register as repeats."""
    assert extract_character("soooo coool")["repeated_char_ratio"] > 0


def test_empty_text():
    """Empty string should return all zeros without raising errors."""
    f = extract_character("")
    assert f["uppercase_ratio"] == 0.0 and f["char_entropy"] == 0.0
