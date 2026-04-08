"""
Tests for Tier 3 -- syntactic feature extraction.

Validates POS ratio detection (nouns, verbs, adjectives), first/second
person pronoun splitting, and modal verb ratio.
"""

from feature_extraction.tokenizer import process
from feature_extraction.tier3_syntactic import extract_syntactic


def test_pos_ratios():
    """Sentence with nouns, verbs, and adjectives should yield positive ratios for all three."""
    f = extract_syntactic(process("The big cat quickly jumped over the small lazy dog."))
    assert f["pos_noun"] > 0 and f["pos_verb"] > 0 and f["pos_adj"] > 0


def test_pronoun_split():
    """Text with both 'I'/'my' and 'you' should produce positive first- and second-person ratios."""
    f = extract_syntactic(process("I told you that my friend and I would help you."))
    assert f["first_person_pronoun_ratio"] > 0 and f["second_person_pronoun_ratio"] > 0


def test_modal_ratio():
    """Sentences with modal verbs (should, could, might) should yield a positive modal ratio."""
    assert extract_syntactic(process("You should try this. It could work. We might succeed."))["modal_ratio"] > 0
