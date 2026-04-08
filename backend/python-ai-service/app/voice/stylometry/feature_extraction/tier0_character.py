"""
Tier 0 — Character-level features (6 features).

Measures raw character composition: case distribution, digit usage,
whitespace and punctuation density, Shannon entropy of the character
stream, and repeated-character ratio.  These low-level signals are
language-model-agnostic and capture typing habits and formatting style.
"""

import math
from collections import Counter


def extract_character(text: str) -> dict:
    """Extract 6 character-level features from raw text.

    Works directly on the character stream without any NLP parsing,
    making it the fastest tier and usable on any language/encoding.

    Returns:
        Dict with keys: uppercase_ratio, digit_ratio, whitespace_ratio,
        punctuation_ratio, char_entropy, repeated_char_ratio.
    """
    total_chars = len(text)
    if total_chars == 0:
        return {
            "uppercase_ratio": 0.0, "digit_ratio": 0.0, "whitespace_ratio": 0.0,
            "punctuation_ratio": 0.0, "char_entropy": 0.0, "repeated_char_ratio": 0.0,
        }

    # Count character categories in a single pass
    uppercase = sum(1 for c in text if c.isupper())
    digits = sum(1 for c in text if c.isdigit())
    whitespace = sum(1 for c in text if c.isspace())
    # Punctuation = anything that is not alphanumeric and not whitespace
    punctuation = sum(1 for c in text if not c.isalnum() and not c.isspace())

    # Shannon entropy: measures character randomness / diversity.
    # Skipped for very short texts (<5 chars) where entropy is unreliable.
    if total_chars < 5:
        entropy = 0.0
    else:
        counts = Counter(text)
        entropy = -sum((c / total_chars) * math.log2(c / total_chars) for c in counts.values())

    # Repeated-char ratio: fraction of positions where char == previous char.
    # Captures habits like "soooo" or "!!!" that signal informal style.
    repeated = sum(1 for i in range(1, total_chars) if text[i] == text[i - 1])

    return {
        "uppercase_ratio": round(uppercase / total_chars, 4),
        "digit_ratio": round(digits / total_chars, 4),
        "whitespace_ratio": round(whitespace / total_chars, 4),
        "punctuation_ratio": round(punctuation / total_chars, 4),
        "char_entropy": round(entropy, 4),
        "repeated_char_ratio": round(repeated / total_chars, 4),
    }
