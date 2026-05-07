"""add player msisdn

Revision ID: 0002_add_player_msisdn
Revises: 0001_initial_schema
Create Date: 2026-05-07 00:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0002_add_player_msisdn"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("winam_players", sa.Column("msisdn", sa.String(length=20), nullable=True))
    op.create_index("uq_winam_players_msisdn", "winam_players", ["msisdn"], unique=True)


def downgrade() -> None:
    op.drop_index("uq_winam_players_msisdn", table_name="winam_players")
    op.drop_column("winam_players", "msisdn")
