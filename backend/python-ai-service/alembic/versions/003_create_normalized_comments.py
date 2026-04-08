"""create normalized_comments table

Revision ID: 003
Revises: 002
Create Date: 2026-04-08
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "normalized_comments",
        sa.Column("canonical_id", sa.String(16), primary_key=True),
        sa.Column("source_platform", sa.String(50), nullable=False),
        sa.Column("source_comment_id", sa.String(255), nullable=False),
        sa.Column("post_canonical_id", sa.String(16),
                   sa.ForeignKey("intel.normalized_posts.canonical_id"), nullable=False),
        sa.Column("author_handle", sa.String(255), nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("score", sa.Integer, server_default="0"),
        sa.Column("depth", sa.Integer, server_default="0"),
        sa.Column("provenance", sa.JSON, server_default="{}"),
        sa.Column("indexed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        schema="intel",
    )


def downgrade() -> None:
    op.drop_table("normalized_comments", schema="intel")
