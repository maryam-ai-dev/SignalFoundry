import logging

from sqlalchemy import text

from app.shared.embeddings import embed_batch

logger = logging.getLogger(__name__)


def embed_and_store_posts(post_canonical_ids: list[str], session) -> int:
    """Fetch posts with no embedding, embed them, store the vectors."""
    if not post_canonical_ids:
        return 0

    placeholders = ",".join(f":id{i}" for i in range(len(post_canonical_ids)))
    params = {f"id{i}": cid for i, cid in enumerate(post_canonical_ids)}

    rows = session.execute(
        text(
            f"SELECT canonical_id, text FROM intel.normalized_posts "
            f"WHERE canonical_id IN ({placeholders}) AND embedding IS NULL"
        ),
        params,
    ).fetchall()

    if not rows:
        logger.info("No posts to embed (all already have embeddings)")
        return 0

    texts = [row.text for row in rows]
    ids = [row.canonical_id for row in rows]

    vectors = embed_batch(texts)

    for cid, vec in zip(ids, vectors):
        vec_str = "[" + ",".join(str(v) for v in vec) + "]"
        session.execute(
            text("UPDATE intel.normalized_posts SET embedding = :vec WHERE canonical_id = :cid"),
            {"vec": vec_str, "cid": cid},
        )

    session.commit()
    logger.info("Embedded %d posts", len(ids))
    return len(ids)
