"""
Tier 1 — Surface-level features (7 features).

Measures sentence and word length distributions (mean, std-dev) plus
punctuation density (commas, question marks, exclamation marks).
These features reflect an author's rhythm and pacing — short punchy
sentences vs. long flowing prose — without requiring any NLP beyond
sentence segmentation.
"""

import statistics


def extract_surface(doc) -> dict:
    """Extract 7 surface-level features from a spaCy Doc.

    Captures sentence-level rhythm (mean & std of sentence/word lengths)
    and punctuation habits. These features require only sentence boundaries
    and tokenization -- no POS tagging or parsing needed.

    Args:
        doc: A spaCy Doc with sentence boundaries set.

    Returns:
        Dict with keys: avg_sentence_length, sentence_length_std,
        avg_word_length, word_length_std, comma_density,
        question_mark_density, exclamation_density.
    """
    sentences = list(doc.sents)
    tokens = [t for t in doc if not t.is_space]  # exclude whitespace-only tokens
    total_tokens = len(tokens)

    if not sentences or total_tokens == 0:
        return {
            "avg_sentence_length": 0.0, "sentence_length_std": 0.0,
            "avg_word_length": 0.0, "word_length_std": 0.0,
            "comma_density": 0.0, "question_mark_density": 0.0, "exclamation_density": 0.0,
        }

    # Sentence length = non-whitespace token count per sentence
    sent_lengths = [len([t for t in s if not t.is_space]) for s in sentences]
    avg_sent_len = statistics.mean(sent_lengths) if sent_lengths else 0.0
    # stdev requires at least 2 data points; single-sentence texts get 0.0
    sent_len_std = statistics.stdev(sent_lengths) if len(sent_lengths) > 1 else 0.0

    # Word length measured only for alphabetic tokens (skip punctuation/numbers)
    word_lengths = [len(t.text) for t in tokens if t.is_alpha]
    avg_word_len = statistics.mean(word_lengths) if word_lengths else 0.0
    word_len_std = statistics.stdev(word_lengths) if len(word_lengths) > 1 else 0.0

    # Punctuation densities normalised by total token count
    commas = sum(1 for t in tokens if t.text == ",")
    questions = sum(1 for t in tokens if t.text == "?")
    exclamations = sum(1 for t in tokens if t.text == "!")

    return {
        "avg_sentence_length": round(avg_sent_len, 4),
        "sentence_length_std": round(sent_len_std, 4),
        "avg_word_length": round(avg_word_len, 4),
        "word_length_std": round(word_len_std, 4),
        "comma_density": round(commas / total_tokens, 4),
        "question_mark_density": round(questions / total_tokens, 4),
        "exclamation_density": round(exclamations / total_tokens, 4),
    }
