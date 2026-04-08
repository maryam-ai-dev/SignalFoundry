"""
Tier 6 — Function-word bigram features (6 features).

Counts consecutive function-word pairs ("of the", "in the", "to the", …)
normalised by total function-word bigram count.  Function words are chosen
unconsciously and their co-occurrence patterns form a stable authorial
fingerprint that is difficult to fake and topic-independent.
"""

from pathlib import Path
from collections import Counter

_DICT_DIR = Path(__file__).parent / "dictionaries"
_FUNCTION_WORDS = set()


def _load_function_words():
    """Load the function-word list from dictionaries/ at import time."""
    global _FUNCTION_WORDS
    path = _DICT_DIR / "function_words.txt"
    if path.exists():
        _FUNCTION_WORDS = {line.strip().lower() for line in path.read_text().splitlines() if line.strip()}


_load_function_words()  # eager load so the set is ready before any extraction call

# The 6 most common function-word bigrams in English prose.
# Normalised by total FW-bigram count (not total tokens) to isolate
# the distribution pattern among function words specifically.
TOP_FW_BIGRAMS = [("of", "the"), ("in", "the"), ("to", "the"), ("for", "the"), ("and", "the"), ("but", "the")]


def extract_fw_bigrams(doc) -> dict:
    """Extract 6 function-word bigram frequency features from a spaCy Doc.

    Builds all consecutive pairs where BOTH tokens are function words,
    then reports the relative frequency of the 6 tracked bigrams.
    Function-word co-occurrence patterns are topic-independent and
    difficult for authors to consciously alter.

    Args:
        doc: A spaCy Doc object.

    Returns:
        Dict with keys like fw_bigram_of_the, fw_bigram_in_the, etc.
    """
    tokens = [t.text.lower() for t in doc if t.is_alpha]
    # Only keep bigrams where both words are function words
    bigrams = [
        (tokens[i], tokens[i + 1])
        for i in range(len(tokens) - 1)
        if tokens[i] in _FUNCTION_WORDS and tokens[i + 1] in _FUNCTION_WORDS
    ]
    total = len(bigrams)
    if total == 0:
        return {f"fw_bigram_{a}_{b}": 0.0 for a, b in TOP_FW_BIGRAMS}
    counts = Counter(bigrams)
    # Frequency relative to total function-word bigrams (not total tokens)
    return {f"fw_bigram_{a}_{b}": round(counts.get((a, b), 0) / total, 4) for a, b in TOP_FW_BIGRAMS}
