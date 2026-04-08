"""
Tier 3 — Syntactic features (10 features).

Uses spaCy POS tags and dependency parses to measure grammatical style:
noun / verb / adjective ratios, modal verb usage, first- and second-person
pronoun ratios, conjunction density, subordinate clause density, sentence
fragment ratio, and average dependency depth.  These features capture how
an author structures arguments and how complex their syntax is.
"""

from pathlib import Path

_DICT_DIR = Path(__file__).parent / "dictionaries"
_MODALS = set()


def _load_modals():
    """Load modal verbs (can, could, should, etc.) from dictionaries/ at import time."""
    global _MODALS
    path = _DICT_DIR / "modals.txt"
    if path.exists():
        _MODALS = {line.strip().lower() for line in path.read_text().splitlines() if line.strip()}


_load_modals()  # eager load so the set is ready before any extraction call


def extract_syntactic(doc) -> dict:
    """Extract 10 syntactic features from a spaCy Doc.

    Uses POS tags and dependency labels to measure grammatical complexity
    and personal-voice preferences. Requires a fully parsed spaCy Doc
    (POS tagger + dependency parser must be active).

    Args:
        doc: A spaCy Doc with POS tags and dependency parses.

    Returns:
        Dict with keys: pos_noun, pos_verb, pos_adj, modal_ratio,
        first_person_pronoun_ratio, second_person_pronoun_ratio,
        conjunction_ratio, clause_density, sentence_fragment_ratio,
        avg_dependency_depth.
    """
    tokens = [t for t in doc if not t.is_space]
    total = len(tokens)

    if total == 0:
        return {
            "pos_noun": 0.0, "pos_verb": 0.0, "pos_adj": 0.0, "modal_ratio": 0.0,
            "first_person_pronoun_ratio": 0.0, "second_person_pronoun_ratio": 0.0,
            "conjunction_ratio": 0.0, "clause_density": 0.0,
            "sentence_fragment_ratio": 0.0, "avg_dependency_depth": 0.0,
        }

    # Count major POS categories in a single pass
    pos_counts = {"NOUN": 0, "VERB": 0, "ADJ": 0, "CCONJ": 0, "SCONJ": 0}
    for t in tokens:
        if t.pos_ in pos_counts:
            pos_counts[t.pos_] += 1

    # Modal verbs indicate hedging / certainty level (e.g., "should", "might")
    modal_count = sum(1 for t in tokens if t.text.lower() in _MODALS)

    # Pronoun person splits: first-person signals self-reference,
    # second-person signals reader-addressing style
    first_person = {"i", "me", "my", "mine", "myself", "we", "us", "our", "ours", "ourselves"}
    second_person = {"you", "your", "yours", "yourself", "yourselves"}
    first_count = sum(1 for t in tokens if t.text.lower() in first_person)
    second_count = sum(1 for t in tokens if t.text.lower() in second_person)
    # Both coordinating (CCONJ: "and", "but") and subordinating (SCONJ: "because", "although")
    conj_count = pos_counts["CCONJ"] + pos_counts["SCONJ"]

    sentences = list(doc.sents)
    num_sentences = len(sentences)

    # Clause density: subordinate clauses per sentence, capturing syntactic complexity.
    # Dependency labels like advcl, relcl, ccomp, xcomp, acl mark embedded clauses.
    sub_clauses = sum(1 for t in tokens if t.dep_ in ("advcl", "relcl", "ccomp", "xcomp", "acl"))
    clause_density = sub_clauses / num_sentences if num_sentences > 0 else 0.0

    # Sentence fragments: sentences without a verbal ROOT (e.g., "Beautiful day.")
    fragments = 0
    for sent in sentences:
        has_verb_root = any(t.dep_ == "ROOT" and t.pos_ in ("VERB", "AUX") for t in sent)
        if not has_verb_root:
            fragments += 1
    fragment_ratio = fragments / num_sentences if num_sentences > 0 else 0.0

    # Average dependency depth: max tree depth per sentence, then averaged.
    # Deeper trees indicate more complex nested syntax.
    depths = []
    for sent in sentences:
        sent_tokens = [t for t in sent if not t.is_space]
        if sent_tokens:
            max_depth = max(len(list(t.ancestors)) for t in sent_tokens)
            depths.append(max_depth)
    avg_dep_depth = sum(depths) / len(depths) if depths else 0.0

    return {
        "pos_noun": round(pos_counts["NOUN"] / total, 4),
        "pos_verb": round(pos_counts["VERB"] / total, 4),
        "pos_adj": round(pos_counts["ADJ"] / total, 4),
        "modal_ratio": round(modal_count / total, 4),
        "first_person_pronoun_ratio": round(first_count / total, 4),
        "second_person_pronoun_ratio": round(second_count / total, 4),
        "conjunction_ratio": round(conj_count / total, 4),
        "clause_density": round(clause_density, 4),
        "sentence_fragment_ratio": round(fragment_ratio, 4),
        "avg_dependency_depth": round(avg_dep_depth, 4),
    }
