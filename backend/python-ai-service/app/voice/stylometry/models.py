from pydantic import BaseModel

from app.voice.stylometry.feature_extraction.schema import FEATURE_ORDER


class StyleFeatureVector(BaseModel):
    """Full 47-feature stylometric vector from Galaxie voice pipeline.
    Also exposes the simplified 10-feature interface for backward compatibility.
    """
    # All 47 features default to 0.0
    features: dict[str, float] = {f: 0.0 for f in FEATURE_ORDER}

    # Simplified accessors (maps to the 10 features in the sprint plan)
    @property
    def avg_sentence_length(self) -> float:
        return self.features.get("avg_sentence_length", 0.0)

    @property
    def sentence_length_variance(self) -> float:
        return self.features.get("sentence_length_std", 0.0) ** 2

    @property
    def avg_word_length(self) -> float:
        return self.features.get("avg_word_length", 0.0)

    @property
    def lexical_diversity(self) -> float:
        return self.features.get("type_token_ratio", 0.0)

    @property
    def punctuation_density(self) -> float:
        return self.features.get("punctuation_ratio", 0.0)

    @property
    def question_frequency(self) -> float:
        return self.features.get("question_mark_density", 0.0)

    @property
    def first_person_frequency(self) -> float:
        return self.features.get("first_person_pronoun_ratio", 0.0)

    @property
    def formality_score(self) -> float:
        # Inverse of contraction + discourse marker usage
        contraction = self.features.get("contraction_ratio", 0.0)
        discourse = self.features.get("discourse_marker_ratio", 0.0)
        return max(0.0, 1.0 - contraction - discourse)

    @property
    def directness_score(self) -> float:
        # Higher verb ratio = more direct
        return self.features.get("pos_verb", 0.0)

    @property
    def word_count(self) -> int:
        # Estimated from avg_sentence_length * sentence count (approximate)
        return self._word_count

    _word_count: int = 0

    @classmethod
    def from_features(cls, features: dict[str, float], word_count: int = 0) -> "StyleFeatureVector":
        vec = cls(features=features)
        vec._word_count = word_count
        return vec
