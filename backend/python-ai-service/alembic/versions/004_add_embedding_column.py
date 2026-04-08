"""add embedding column to normalized_posts

Revision ID: 004
Revises: 003
Create Date: 2026-04-08
"""
from typing import Sequence, Union

from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE intel.normalized_posts ADD COLUMN embedding vector(384)")
    op.execute(
        "CREATE INDEX idx_normalized_posts_embedding ON intel.normalized_posts "
        "USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS intel.idx_normalized_posts_embedding")
    op.execute("ALTER TABLE intel.normalized_posts DROP COLUMN IF EXISTS embedding")
