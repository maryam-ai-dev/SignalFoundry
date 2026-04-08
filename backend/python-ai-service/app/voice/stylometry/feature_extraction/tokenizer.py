"""
Tokenizer -- thin wrapper around spaCy for text preprocessing.

Loads the small English model once at import time (excluding NER and
lemmatizer components that are not needed for stylometric analysis).
All text is truncated to 5000 characters to bound processing time
and keep feature extraction latency predictable.
"""

import spacy

# Load spaCy model once at module level; NER and lemmatizer are excluded
# because the feature extractors only need POS tags and dependency parses.
_nlp = spacy.load("en_core_web_sm", exclude=["ner", "lemmatizer"])


def process(text: str):
    """Parse a single text and return a spaCy Doc, truncated to 5000 chars."""
    text = text[:5000]  # hard limit to avoid excessive processing time
    return _nlp(text)


def process_batch(texts: list[str]):
    """Parse multiple texts via spaCy's nlp.pipe() for batched throughput."""
    truncated = [t[:5000] for t in texts]
    return list(_nlp.pipe(truncated))
