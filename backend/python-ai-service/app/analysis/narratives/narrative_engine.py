import logging
import uuid
from collections import defaultdict

import numpy as np
from pydantic import BaseModel
from sklearn.cluster import KMeans

from app.normalization.models import NormalizedPost
from app.shared.llm import complete

logger = logging.getLogger(__name__)


class NarrativeCluster(BaseModel):
    cluster_id: str
    summary: str
    post_count: int
    canonical_post_ids: list[str]


def cluster_posts(embeddings: list[tuple[str, list[float]]]) -> list[list[str]]:
    """Cluster posts by embedding similarity using KMeans.
    Returns groups of canonical_ids — each ID appears in exactly one group.
    """
    if not embeddings:
        return []

    ids = [e[0] for e in embeddings]
    vectors = np.array([e[1] for e in embeddings])

    k = min(5, max(1, len(embeddings) // 3))

    if k <= 1:
        return [ids]

    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(vectors)

    groups: defaultdict[int, list[str]] = defaultdict(list)
    for cid, label in zip(ids, labels):
        groups[label].append(cid)

    return list(groups.values())


def summarize_cluster(post_texts: list[str]) -> str:
    """Summarize a cluster of related posts into 1-2 sentences."""
    sampled = [t[:200] for t in post_texts[:5]]
    combined = "\n---\n".join(sampled)

    return complete(
        "These posts share a common theme. Summarize the core narrative in 1-2 sentences. Be specific.",
        combined,
        max_tokens=150,
    )


def build_narrative_clusters(
    posts: list[NormalizedPost],
    embeddings: list[tuple[str, list[float]]],
) -> list[NarrativeCluster]:
    """Cluster posts by embedding, then summarize each cluster via LLM."""
    groups = cluster_posts(embeddings)
    if not groups:
        return []

    post_map = {p.canonical_id: p for p in posts}
    clusters: list[NarrativeCluster] = []

    for group_ids in groups:
        texts = []
        for cid in group_ids:
            p = post_map.get(cid)
            if p:
                texts.append(p.text or p.title or "")

        summary = summarize_cluster(texts) if texts else "[no text]"

        clusters.append(NarrativeCluster(
            cluster_id=uuid.uuid4().hex[:12],
            summary=summary,
            post_count=len(group_ids),
            canonical_post_ids=group_ids,
        ))

    return clusters
