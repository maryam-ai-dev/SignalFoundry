"""create normalized_posts table

Revision ID: 002
Revises: 001
Create Date: 2026-04-08
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "normalized_posts",
        sa.Column("canonical_id", sa.String(16), primary_key=True),
        sa.Column("source_platform", sa.String(50), nullable=False),
        sa.Column("source_post_id", sa.String(255), nullable=False),
        sa.Column("workspace_id", sa.String(255), nullable=False),
        sa.Column("author_handle", sa.String(255), nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("title", sa.Text),
        sa.Column("url", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("score", sa.Integer, server_default="0"),
        sa.Column("comment_count", sa.Integer, server_default="0"),
        sa.Column("topic_tags", sa.JSON, server_default="[]"),
        sa.Column("provenance", sa.JSON, server_default="{}"),
        sa.Column("raw_metadata", sa.JSON, server_default="{}"),
        sa.Column("indexed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema="intel",
    )


def downgrade() -> None:
    op.drop_table("normalized_posts", schema="intel")
