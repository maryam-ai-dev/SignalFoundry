"""
Feature extraction pipeline — orchestrates all 7 tiers to produce a
47-feature vector for each input text.  Features are returned in the
canonical order defined in schema.FEATURE_ORDER (must match the Java
StyleFeature enum).
"""

from .tier0_character import extract_character
from .tier5_char_ngrams import extract_char_ngrams
from .tokenizer import process, process_batch
from .registry import EXTRACTORS
from .schema import FEATURE_ORDER


def extract_features(text: str) -> dict:
    """Extract all 47 stylometric features from a single text string.

    Tiers 0 and 5 operate on raw text (no NLP needed), so they run first.
    The remaining tiers (1-4, 6) require a spaCy Doc produced by the tokenizer.
    Returns an ordered dict of exactly 47 float-valued features.
    """
    features = {}
    # Tiers 0 & 5: raw-text features (character stats + char trigrams)
    features.update(extract_character(text))
    features.update(extract_char_ngrams(text))
    # Tiers 1-4, 6: NLP-based features that need a spaCy Doc
    doc = process(text)
    for extractor in EXTRACTORS:
        features.update(extractor(doc))
    return _finalize(features)


def extract_features_batch(texts: list[str]) -> list[dict]:
    """Extract features for multiple texts, leveraging spaCy's pipe() for throughput.

    Raw-text tiers are computed per-text first, then all texts are parsed
    in one batch via spaCy's nlp.pipe() to amortise model-loading overhead.
    """
    if len(texts) == 0:
        return []

    # Phase 1: compute raw-text features (tiers 0 & 5) before NLP parsing
    raw_features = []
    for text in texts:
        raw = {}
        raw.update(extract_character(text))
        raw.update(extract_char_ngrams(text))
        raw_features.append(raw)

    # Phase 2: batch-parse all texts through spaCy in one pass
    docs = process_batch(texts)

    # Phase 3: merge NLP-based features with raw-text features per document
    results = []
    for raw, doc in zip(raw_features, docs):
        features = dict(raw)
        for extractor in EXTRACTORS:
            features.update(extractor(doc))
        results.append(_finalize(features))

    return results


def _finalize(features: dict) -> dict:
    """Reorder features into canonical schema order and validate completeness.

    Fills any missing keys with 0.0 and ensures exactly 47 features are
    present, raising RuntimeError on schema mismatches to catch regressions.
    """
    result = {k: float(features.get(k, 0.0)) for k in FEATURE_ORDER}
    if len(result) != len(FEATURE_ORDER):
        raise RuntimeError(
            f"Feature schema mismatch: expected {len(FEATURE_ORDER)}, got {len(result)}"
        )
    return result
