"""
Tests for Tier 6 -- function-word bigram feature extraction.

Validates that known FW bigrams ('of the', 'in the') are detected
and that text without function-word pairs returns zero.
"""

from feature_extraction.tokenizer import process
from feature_extraction.tier6_fw_bigrams import extract_fw_bigrams


def test_fw_bigrams_detected():
    """Text with 'of the' and 'in the' should yield positive bigram frequencies."""
    f = extract_fw_bigrams(process("The design of the system in the cloud for the users."))
    assert f["fw_bigram_of_the"] > 0 and f["fw_bigram_in_the"] > 0


def test_no_fw_bigrams():
    """Content words only (no function-word pairs) should yield zero for all bigrams."""
    assert extract_fw_bigrams(process("Cat dog bird."))["fw_bigram_of_the"] == 0.0
