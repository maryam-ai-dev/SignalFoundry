"""
Tier 2 — Lexical features (6 features).

Measures vocabulary richness and word-choice patterns: type-token ratio,
hapax legomena (words used only once), function-word and stopword ratios,
contraction usage, and Yule's K — a corpus-size-independent measure of
lexical diversity.  High TTR signals a varied vocabulary; high contraction
ratio signals informal register.
"""

from pathlib import Path
from collections import Counter
from spacy.lang.en.stop_words import STOP_WORDS

_DICT_DIR = Path(__file__).parent / "dictionaries"
_FUNCTION_WORDS = set()


def _load_function_words():
    """Load the function-word list from dictionaries/ at import time."""
    global _FUNCTION_WORDS
    path = _DICT_DIR / "function_words.txt"
    if path.exists():
        _FUNCTION_WORDS = {line.strip().lower() for line in path.read_text().splitlines() if line.strip()}


_load_function_words()  # eager load so the set is ready before any extraction call

# Common English contraction suffixes used to detect informal writing style.
# spaCy splits contractions into separate tokens (e.g., "don't" -> "do" + "n't").
_CONTRACTION_SUFFIXES = {"n't", "'s", "'re", "'ve", "'ll", "'m", "'d"}


def extract_lexical(doc) -> dict:
    """Extract 6 lexical-diversity features from a spaCy Doc.

    Measures vocabulary richness (TTR, hapax legomena, Yule's K) and
    word-choice preferences (function words, stopwords, contractions).

    Args:
        doc: A spaCy Doc object.

    Returns:
        Dict with keys: type_token_ratio, hapax_legomena_ratio,
        function_word_ratio, stopword_ratio, contraction_ratio, yules_k.
    """
    words = [t.text.lower() for t in doc if t.is_alpha]
    total = len(words)

    if total == 0:
        return {
            "type_token_ratio": 0.0, "hapax_legomena_ratio": 0.0,
            "function_word_ratio": 0.0, "stopword_ratio": 0.0,
            "contraction_ratio": 0.0, "yules_k": 0.0,
        }

    unique = set(words)
    freq = Counter(words)
    # Hapax legomena: words that appear exactly once -- a hallmark of rich vocabulary
    hapax = sum(1 for w, c in freq.items() if c == 1)
    function_count = sum(1 for w in words if w in _FUNCTION_WORDS)
    stopword_count = sum(1 for w in words if w in STOP_WORDS)

    # Yule's K: a vocabulary richness measure that is more stable across
    # varying text lengths than TTR. Formula: K = 10000 * (M2 - M1) / M1^2
    # where M1 = total words, M2 = sum of squared frequencies.
    m1 = total
    m2 = sum(v * v for v in freq.values())
    yules_k = 10000 * (m2 - m1) / (m1 * m1) if m1 > 0 else 0.0

    # Contraction ratio uses all non-space tokens (not just alphabetic)
    # because contraction suffixes like "n't" contain punctuation.
    all_tokens = [t.text.lower() for t in doc if not t.is_space]
    contraction_count = sum(1 for t in all_tokens if t in _CONTRACTION_SUFFIXES)
    total_tokens = len(all_tokens)

    return {
        "type_token_ratio": round(len(unique) / total, 4),
        "hapax_legomena_ratio": round(hapax / total, 4),
        "function_word_ratio": round(function_count / total, 4),
        "stopword_ratio": round(stopword_count / total, 4),
        "contraction_ratio": round(contraction_count / total_tokens, 4) if total_tokens else 0.0,
        "yules_k": round(yules_k, 4),
    }
