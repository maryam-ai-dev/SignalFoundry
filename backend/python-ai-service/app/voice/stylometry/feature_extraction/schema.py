"""
Canonical feature order -- 47 features across 7 tiers.

This ordering MUST match the Java StyleFeature enum exactly so that
feature vectors produced by the Python pipeline align with the indices
expected by the Java-based classifier. Any additions or reorderings
must be coordinated across both codebases.
"""

FEATURE_ORDER = [
    # --- Tier 0: Character-level (6) ---
    "uppercase_ratio", "digit_ratio", "whitespace_ratio", "punctuation_ratio",
    "char_entropy", "repeated_char_ratio",
    # --- Tier 1: Surface-level (7) ---
    "avg_sentence_length", "sentence_length_std", "avg_word_length", "word_length_std",
    "comma_density", "question_mark_density", "exclamation_density",
    # --- Tier 2: Lexical (6) ---
    "type_token_ratio", "hapax_legomena_ratio", "function_word_ratio",
    "stopword_ratio", "contraction_ratio", "yules_k",
    # --- Tier 3: Syntactic (10) ---
    "pos_noun", "pos_verb", "pos_adj", "modal_ratio",
    "first_person_pronoun_ratio", "second_person_pronoun_ratio",
    "conjunction_ratio", "clause_density", "sentence_fragment_ratio", "avg_dependency_depth",
    # --- Tier 4: Psycholinguistic (2) ---
    "discourse_marker_ratio", "intensifier_ratio",
    # --- Tier 5: Character tri-grams (10) ---
    "trigram_the", "trigram_ing", "trigram_ion", "trigram_ent", "trigram_and",
    "trigram_tio", "trigram_her", "trigram_for", "trigram_tha", "trigram_ter",
    # --- Tier 6: Function-word bigrams (6) ---
    "fw_bigram_of_the", "fw_bigram_in_the", "fw_bigram_to_the",
    "fw_bigram_for_the", "fw_bigram_and_the", "fw_bigram_but_the",
]
