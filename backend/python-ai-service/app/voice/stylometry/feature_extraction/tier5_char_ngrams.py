"""
Tier 5 — Character tri-gram features (10 features).

Computes relative frequencies of the 10 most common English character
tri-grams ("the", "ing", "ion", …) after lowercasing and replacing
spaces with underscores.  Character n-grams capture sub-word patterns
that are resilient to vocabulary substitution, making them strong
authorship signals even when an author deliberately varies word choice.
"""

from collections import Counter

# The 10 most frequent English character tri-grams (empirically determined).
# Only these are tracked to keep the feature vector fixed-size.
TOP_TRIGRAMS = ["the", "ing", "ion", "ent", "and", "tio", "her", "for", "tha", "ter"]


def extract_char_ngrams(text: str) -> dict:
    """Extract 10 character tri-gram frequency features from raw text.

    Spaces are replaced with underscores so that word-boundary tri-grams
    (e.g., "e_t" spanning "the thing") are captured -- these cross-word
    patterns are strong authorship signals.

    Args:
        text: Raw input text string.

    Returns:
        Dict with keys like trigram_the, trigram_ing, etc., each a
        relative frequency (count / total trigrams).
    """
    # Lowercase and replace spaces with underscores to capture cross-word boundaries
    text_lower = text.lower().replace(" ", "_")
    # Slide a 3-char window across the entire text
    trigrams = [text_lower[i:i + 3] for i in range(len(text_lower) - 2)]
    total = len(trigrams)
    if total == 0:
        return {f"trigram_{t}": 0.0 for t in TOP_TRIGRAMS}
    counts = Counter(trigrams)
    # Return relative frequency for each tracked tri-gram
    return {f"trigram_{t}": round(counts.get(t, 0) / total, 4) for t in TOP_TRIGRAMS}
