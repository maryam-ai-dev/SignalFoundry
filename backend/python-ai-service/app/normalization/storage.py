from datetime import datetime, timezone

from sqlalchemy import Column, ForeignKey, String, Text, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import insert

from app.normalization.models import NormalizedComment, NormalizedPost
from app.shared.database import Base


class NormalizedPostDB(Base):
    __tablename__ = "normalized_posts"
    __table_args__ = {"schema": "intel"}

    canonical_id = Column(String(16), primary_key=True)
    source_platform = Column(String(50), nullable=False)
    source_post_id = Column(String(255), nullable=False)
    workspace_id = Column(String(255), nullable=False)
    author_handle = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    title = Column(Text)
    url = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False)
    score = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    topic_tags = Column(JSON, default=list)
    provenance = Column(JSON, default=dict)
    raw_metadata = Column(JSON, default=dict)
    indexed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


def save_posts(posts: list[NormalizedPost], session) -> int:
    if not posts:
        return 0

    rows = []
    for p in posts:
        rows.append({
            "canonical_id": p.canonical_id,
            "source_platform": p.source_platform,
            "source_post_id": p.source_post_id,
            "workspace_id": p.workspace_id,
            "author_handle": p.author_handle,
            "text": p.text,
            "title": p.title,
            "url": p.url,
            "created_at": p.created_at,
            "score": p.score,
            "comment_count": p.comment_count,
            "topic_tags": p.topic_tags,
            "provenance": p.provenance,
            "raw_metadata": p.raw_metadata,
            "indexed_at": datetime.now(timezone.utc),
        })

    stmt = insert(NormalizedPostDB).values(rows).on_conflict_do_nothing(index_elements=["canonical_id"])
    result = session.execute(stmt)
    session.commit()
    return result.rowcount


class NormalizedCommentDB(Base):
    __tablename__ = "normalized_comments"
    __table_args__ = {"schema": "intel"}

    canonical_id = Column(String(16), primary_key=True)
    source_platform = Column(String(50), nullable=False)
    source_comment_id = Column(String(255), nullable=False)
    post_canonical_id = Column(String(16), ForeignKey("intel.normalized_posts.canonical_id"), nullable=False)
    author_handle = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    score = Column(Integer, default=0)
    depth = Column(Integer, default=0)
    provenance = Column(JSON, default=dict)
    indexed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


def save_comments(comments: list[NormalizedComment], session) -> int:
    if not comments:
        return 0

    rows = []
    for c in comments:
        rows.append({
            "canonical_id": c.canonical_id,
            "source_platform": c.source_platform,
            "source_comment_id": c.source_comment_id,
            "post_canonical_id": c.post_canonical_id,
            "author_handle": c.author_handle,
            "text": c.text,
            "created_at": c.created_at,
            "score": c.score,
            "depth": c.depth,
            "provenance": c.provenance,
            "indexed_at": datetime.now(timezone.utc),
        })

    stmt = insert(NormalizedCommentDB).values(rows).on_conflict_do_nothing(index_elements=["canonical_id"])
    result = session.execute(stmt)
    session.commit()
    return result.rowcount
