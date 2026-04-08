"""
Feature extractor — wraps the Galaxie 47-feature pipeline.
Provides both the full vector and the simplified 10-feature interface.
"""
import logging

from app.voice.stylometry.feature_extraction.pipeline import (
    extract_features as _extract_raw,
    extract_features_batch as _extract_raw_batch,
)
from app.voice.stylometry.models import StyleFeatureVector

logger = logging.getLogger(__name__)


def extract_features(text: str) -> StyleFeatureVector:
    """Extract a StyleFeatureVector from a single text sample."""
    if not text or not text.strip():
        return StyleFeatureVector()

    try:
        raw = _extract_raw(text)
        word_count = len(text.split())
        return StyleFeatureVector.from_features(raw, word_count)
    except Exception as e:
        logger.error("Feature extraction failed: %s", e)
        return StyleFeatureVector()


def extract_features_batch(texts: list[str]) -> list[StyleFeatureVector]:
    """Extract StyleFeatureVectors for multiple texts (leverages spaCy batch)."""
    if not texts:
        return []

    try:
        raw_list = _extract_raw_batch(texts)
        results = []
        for text, raw in zip(texts, raw_list):
            wc = len(text.split()) if text else 0
            results.append(StyleFeatureVector.from_features(raw, wc))
        return results
    except Exception as e:
        logger.error("Batch feature extraction failed: %s", e)
        return [StyleFeatureVector() for _ in texts]
