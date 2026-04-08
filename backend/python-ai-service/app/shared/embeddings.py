import logging

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

_model = SentenceTransformer("all-MiniLM-L6-v2")
EMBEDDING_DIM = 384


def embed_text(text: str) -> list[float]:
    if not text or not text.strip():
        return [0.0] * EMBEDDING_DIM
    vector = _model.encode(text, convert_to_numpy=True)
    return vector.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    clean = [t if t and t.strip() else " " for t in texts]
    vectors = _model.encode(clean, convert_to_numpy=True)
    return vectors.tolist()
