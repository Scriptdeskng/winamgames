"""add monthly subscription plan

Revision ID: 0005_monthly_plan
Revises: 0004_intelli_evt_changes
Create Date: 2026-05-07 00:00:00
"""

from __future__ import annotations

from alembic import op


revision = "0005_monthly_plan"
down_revision = "0004_intelli_evt_changes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'monthly'")


def downgrade() -> None:
    # PostgreSQL enums cannot easily remove values safely in-place.
    pass
