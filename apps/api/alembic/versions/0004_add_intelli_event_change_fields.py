"""add intelli event change fields

Revision ID: 0004_intelli_evt_changes
Revises: 0003_add_intelli_events
Create Date: 2026-05-07 00:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0004_intelli_evt_changes"
down_revision = "0003_add_intelli_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("winam_intelli_events", sa.Column("previous_status", sa.String(length=40), nullable=True))
    op.add_column("winam_intelli_events", sa.Column("new_status", sa.String(length=40), nullable=True))
    op.add_column("winam_intelli_events", sa.Column("changed_existing", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("winam_intelli_events", "changed_existing")
    op.drop_column("winam_intelli_events", "new_status")
    op.drop_column("winam_intelli_events", "previous_status")
