"""add intelli events"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0003_add_intelli_events"
down_revision = "0002_add_player_msisdn"
branch_labels = None
depends_on = None


intelli_events_table = sa.Table(
    "winam_intelli_events",
    sa.MetaData(),
)


def upgrade() -> None:
    op.create_table(
        "winam_intelli_events",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("telco", sa.String(length=20), nullable=True),
        sa.Column("action", sa.String(length=40), nullable=True),
        sa.Column("msisdn", sa.String(length=20), nullable=True),
        sa.Column("product_id", sa.String(length=80), nullable=True),
        sa.Column("product_name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=True),
        sa.Column("auto_renewal", sa.Boolean(), nullable=True),
        sa.Column("telco_ref", sa.String(length=255), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("player_id", sa.String(length=36), sa.ForeignKey("winam_players.id"), nullable=True),
        sa.Column("subscription_id", sa.String(length=36), sa.ForeignKey("winam_subscriptions.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_winam_intelli_events_msisdn", "winam_intelli_events", ["msisdn"])
    op.create_index("ix_winam_intelli_events_player_id", "winam_intelli_events", ["player_id"])
    op.create_index("ix_winam_intelli_events_subscription_id", "winam_intelli_events", ["subscription_id"])


def downgrade() -> None:
    op.drop_index("ix_winam_intelli_events_subscription_id", table_name="winam_intelli_events")
    op.drop_index("ix_winam_intelli_events_player_id", table_name="winam_intelli_events")
    op.drop_index("ix_winam_intelli_events_msisdn", table_name="winam_intelli_events")
    op.drop_table("winam_intelli_events")
