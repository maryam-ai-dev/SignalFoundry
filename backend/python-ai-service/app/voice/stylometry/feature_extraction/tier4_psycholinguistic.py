"""
Tier 4 — Psycholinguistic features (2 features).

Counts discourse markers ("however", "in fact", "on the other hand") and
intensifiers ("very", "really", "extremely") relative to token count.
Discourse markers signal how an author connects ideas; intensifiers reveal
emotional emphasis patterns.  Both are largely unconscious habits that
persist across topics.
"""

from pathlib import Path

_DICT_DIR = Path(__file__).parent / "dictionaries"
_DISCOURSE_MARKERS = set()
_INTENSIFIERS = set()


def _load_dictionaries():
    """Load discourse-marker and intensifier word lists from dictionaries/ at import time."""
    global _DISCOURSE_MARKERS, _INTENSIFIERS
    dm_path = _DICT_DIR / "discourse_markers.txt"
    if dm_path.exists():
        _DISCOURSE_MARKERS = {line.strip().lower() for line in dm_path.read_text().splitlines() if line.strip()}
    int_path = _DICT_DIR / "intensifiers.txt"
    if int_path.exists():
        _INTENSIFIERS = {line.strip().lower() for line in int_path.read_text().splitlines() if line.strip()}


_load_dictionaries()  # eager load so sets are ready before any extraction call


def extract_psycholinguistic(doc) -> dict:
    """Extract 2 psycholinguistic features from a spaCy Doc.

    Discourse markers (e.g., "however", "in fact") reveal how an author
    connects ideas. Intensifiers (e.g., "very", "extremely") reveal
    emotional emphasis patterns. Both are largely unconscious habits.

    Multi-word markers (like "on the other hand") are matched via substring
    search on the full text; single-word markers are matched token-by-token.

    Args:
        doc: A spaCy Doc object.

    Returns:
        Dict with keys: discourse_marker_ratio, intensifier_ratio.
    """
    tokens = [t for t in doc if not t.is_space]
    total = len(tokens)

    if total == 0:
        return {"discourse_marker_ratio": 0.0, "intensifier_ratio": 0.0}

    text_lower = doc.text.lower()
    marker_count = 0

    # Multi-word markers (e.g., "on the other hand") must be found via
    # substring search because spaCy splits them across multiple tokens.
    multi_word = [m for m in _DISCOURSE_MARKERS if " " in m]
    for marker in multi_word:
        marker_count += text_lower.count(marker)

    # Single-word markers can be matched efficiently per-token
    single_word = {m for m in _DISCOURSE_MARKERS if " " not in m}
    for t in tokens:
        if t.text.lower() in single_word:
            marker_count += 1

    intensifier_count = sum(1 for t in tokens if t.text.lower() in _INTENSIFIERS)

    return {
        "discourse_marker_ratio": round(marker_count / total, 4),
        "intensifier_ratio": round(intensifier_count / total, 4),
    }
