import logging
from collections import defaultdict

import numpy as np
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)


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
