"""
Extractor registry -- central list of all NLP-based feature extractors.

Each extractor is a callable that takes a spaCy Doc and returns a dict of
feature-name -> float pairs. The pipeline iterates this list in order, so
adding a new tier only requires appending its extractor function here.

Note: Tiers 0 and 5 (character-level and char n-grams) are NOT included
because they operate on raw text, not spaCy Docs, and are called separately
in the pipeline.
"""

from .tier1_surface import extract_surface
from .tier2_lexical import extract_lexical
from .tier3_syntactic import extract_syntactic
from .tier4_psycholinguistic import extract_psycholinguistic
from .tier6_fw_bigrams import extract_fw_bigrams

# Ordered list of extractors that require a spaCy Doc as input.
# The pipeline calls each one and merges the returned dicts.
EXTRACTORS = [
    extract_surface,
    extract_lexical,
    extract_syntactic,
    extract_psycholinguistic,
    extract_fw_bigrams,
]
