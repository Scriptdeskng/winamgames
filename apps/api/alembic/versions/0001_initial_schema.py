"""initial schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-05-06 00:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


draw_week_status = sa.Enum("open", "locked", "drawn", "settled", name="draw_week_status")
entry_source_type = sa.Enum("game_session", "mission", "streak_bonus", "streak", name="entry_source_type")
game_type = sa.Enum("checkmate", "wisdomdrop", name="game_type")
mission_condition_type = sa.Enum("puzzles_solved", "no_hints", "streak_day", "game_type_mix", name="mission_condition_type")
mission_status = sa.Enum("pending", "completed", "expired", name="mission_status")
puzzle_result = sa.Enum("correct", "incorrect", "hint_used", "timeout", name="puzzle_result")
rank_tier = sa.Enum("starter", "recruit", "sergeant", "veteran", "champion", "icon", "legend", "immortal", name="rank_tier")
reward_type = sa.Enum("coins", "entries", name="reward_type")
subscription_plan = sa.Enum("daily", "weekly", name="subscription_plan")
subscription_status = sa.Enum("active", "grace", "expired", "cancelled", name="subscription_status")


def upgrade() -> None:
    op.create_table(
        "winam_admin_users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default=sa.text("'admin'")),
    )
    op.create_table(
        "winam_admin_audit_log",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("admin_id", sa.String(length=36), sa.ForeignKey("winam_admin_users.id"), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("target_type", sa.String(length=80), nullable=True),
        sa.Column("target_id", sa.String(length=80), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "winam_banners",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("subtitle", sa.String(length=255), nullable=False),
        sa.Column("icon_url", sa.String(length=512), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "winam_draw_weeks",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("week_start_wat", sa.Date(), nullable=False),
        sa.Column("week_end_wat", sa.Date(), nullable=False),
        sa.Column("entry_lock_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("draw_executes_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", draw_week_status, nullable=False),
        sa.Column("total_entries", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("draw_seed", sa.String(length=128), nullable=True),
    )
    op.create_table(
        "winam_players",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("msisdn_hash", sa.String(length=128), nullable=False),
        sa.Column("msisdn_last4", sa.String(length=4), nullable=False),
        sa.Column("nickname", sa.String(length=40), nullable=True, unique=True),
        sa.Column("avatar_id", sa.Integer(), nullable=True),
        sa.Column("coin_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("xp_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rank_tier", rank_tier, nullable=False),
        sa.Column("device_fingerprint", sa.String(length=255), nullable=True),
        sa.Column("is_flagged", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("flag_reason", sa.String(length=255), nullable=True),
        sa.Column("last_session_date", sa.Date(), nullable=True),
    )
    op.create_index("ix_winam_players_msisdn_hash", "winam_players", ["msisdn_hash"])
    op.create_table(
        "winam_subscriptions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("player_id", sa.String(length=36), sa.ForeignKey("winam_players.id"), nullable=False),
        sa.Column("plan", subscription_plan, nullable=False),
        sa.Column("status", subscription_status, nullable=False),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("grace_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_billed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("carrier_ref", sa.String(length=255), nullable=True),
    )
    op.create_index("ix_winam_subscriptions_player_id", "winam_subscriptions", ["player_id"])
    op.create_table(
        "winam_otp_sessions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("msisdn_hash", sa.String(length=128), nullable=False),
        sa.Column("code_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index("ix_winam_otp_sessions_msisdn_hash", "winam_otp_sessions", ["msisdn_hash"])
    op.create_table(
        "winam_missions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("condition_type", mission_condition_type, nullable=False),
        sa.Column("condition_value", sa.Integer(), nullable=False),
        sa.Column("reward_type", reward_type, nullable=False),
        sa.Column("reward_amount", sa.Integer(), nullable=False),
        sa.Column("game_type", game_type, nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "winam_game_sessions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("player_id", sa.String(length=36), sa.ForeignKey("winam_players.id"), nullable=False),
        sa.Column("draw_week_id", sa.String(length=36), sa.ForeignKey("winam_draw_weeks.id"), nullable=False),
        sa.Column("game_type", game_type, nullable=False),
        sa.Column("session_date_wat", sa.Date(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("puzzles_solved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hints_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("entries_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("coins_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_free_session", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("wisdom_accuracy", sa.Numeric(5, 2), nullable=True),
    )
    op.create_index("ix_winam_game_sessions_player_id", "winam_game_sessions", ["player_id"])
    op.create_index("ix_winam_game_sessions_draw_week_id", "winam_game_sessions", ["draw_week_id"])
    op.create_table(
        "winam_player_missions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("player_id", sa.String(length=36), sa.ForeignKey("winam_players.id"), nullable=False),
        sa.Column("mission_id", sa.String(length=36), sa.ForeignKey("winam_missions.id"), nullable=False),
        sa.Column("draw_week_id", sa.String(length=36), sa.ForeignKey("winam_draw_weeks.id"), nullable=False),
        sa.Column("status", mission_status, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("progress_current", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("entries_awarded", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("assigned_date_wat", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_winam_player_missions_player_id", "winam_player_missions", ["player_id"])
    op.create_index("ix_winam_player_missions_mission_id", "winam_player_missions", ["mission_id"])
    op.create_index("ix_winam_player_missions_draw_week_id", "winam_player_missions", ["draw_week_id"])
    op.create_table(
        "winam_entry_ledger",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("player_id", sa.String(length=36), sa.ForeignKey("winam_players.id"), nullable=False),
        sa.Column("draw_week_id", sa.String(length=36), sa.ForeignKey("winam_draw_weeks.id"), nullable=False),
        sa.Column("source_type", entry_source_type, nullable=False),
        sa.Column("source_id", sa.String(length=128), nullable=True),
        sa.Column("entries_delta", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cap_overflow", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("week_total_after", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_winam_entry_ledger_player_id", "winam_entry_ledger", ["player_id"])
    op.create_index("ix_winam_entry_ledger_draw_week_id", "winam_entry_ledger", ["draw_week_id"])
    op.create_table(
        "winam_puzzle_attempts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("session_id", sa.String(length=36), sa.ForeignKey("winam_game_sessions.id"), nullable=False),
        sa.Column("puzzle_id", sa.String(length=128), nullable=False),
        sa.Column("result", puzzle_result, nullable=False),
        sa.Column("time_to_solve_ms", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("moves_submitted", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
    )
    op.create_index("ix_winam_puzzle_attempts_session_id", "winam_puzzle_attempts", ["session_id"])
    op.create_table(
        "winam_kyc",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("player_id", sa.String(length=36), sa.ForeignKey("winam_players.id"), nullable=False, unique=True),
        sa.Column("first_name", sa.String(length=120), nullable=False),
        sa.Column("last_name", sa.String(length=120), nullable=False),
        sa.Column("dob", sa.String(length=20), nullable=False),
        sa.Column("id_type", sa.String(length=50), nullable=False),
        sa.Column("id_number", sa.String(length=120), nullable=False),
        sa.Column("bank_name", sa.String(length=120), nullable=True),
        sa.Column("bank_code", sa.String(length=20), nullable=True),
        sa.Column("account_name", sa.String(length=120), nullable=True),
        sa.Column("account_number", sa.String(length=20), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("bank_details_submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_by", sa.String(length=36), sa.ForeignKey("winam_admin_users.id"), nullable=True),
    )
    op.create_table(
        "winam_winners",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("draw_week_id", sa.String(length=36), sa.ForeignKey("winam_draw_weeks.id"), nullable=True),
        sa.Column("player_id", sa.String(length=36), sa.ForeignKey("winam_players.id"), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("prize_type", sa.String(length=50), nullable=False),
        sa.Column("prize_amount", sa.Integer(), nullable=False),
        sa.Column("ticket_id", sa.String(length=80), nullable=False),
        sa.Column("is_flagged", sa.Boolean(), nullable=True),
    )
    op.create_index("ix_winam_winners_draw_week_id", "winam_winners", ["draw_week_id"])
    op.create_index("ix_winam_winners_player_id", "winam_winners", ["player_id"])
    op.create_table(
        "winam_payments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("player_id", sa.String(length=36), sa.ForeignKey("winam_players.id"), nullable=False),
        sa.Column("winner_id", sa.String(length=36), sa.ForeignKey("winam_winners.id"), nullable=False),
        sa.Column("draw_week_id", sa.String(length=36), sa.ForeignKey("winam_draw_weeks.id"), nullable=False),
        sa.Column("amount_naira", sa.Integer(), nullable=False),
        sa.Column("prize_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_by", sa.String(length=36), sa.ForeignKey("winam_admin_users.id"), nullable=True),
    )
    op.create_index("ix_winam_payments_player_id", "winam_payments", ["player_id"])
    op.create_index("ix_winam_payments_winner_id", "winam_payments", ["winner_id"])
    op.create_index("ix_winam_payments_draw_week_id", "winam_payments", ["draw_week_id"])
    op.create_table(
        "winam_platform_config",
        sa.Column("key", sa.String(length=120), primary_key=True),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
    )
    op.create_table(
        "winam_checkmate_puzzles",
        sa.Column("id", sa.String(length=80), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("fen", sa.String(length=500), nullable=False),
        sa.Column("solution_move", sa.String(length=40), nullable=False),
        sa.Column("theme", sa.String(length=120), nullable=False),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("hint_piece", sa.String(length=20), nullable=True),
        sa.Column("hint_destination", sa.String(length=20), nullable=True),
        sa.Column("opponent_from", sa.String(length=20), nullable=True),
        sa.Column("opponent_to", sa.String(length=20), nullable=True),
        sa.Column("times_served", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "winam_wisdom_puzzles",
        sa.Column("id", sa.String(length=80), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("display_text", sa.String(length=500), nullable=False),
        sa.Column("original_proverb", sa.String(length=500), nullable=False),
        sa.Column("blank", sa.String(length=120), nullable=False),
        sa.Column("region", sa.String(length=120), nullable=False),
        sa.Column("difficulty", sa.String(length=40), nullable=False),
        sa.Column("options", sa.JSON(), nullable=False),
        sa.Column("correct_index", sa.Integer(), nullable=False),
        sa.Column("explanation", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    for table in [
        "winam_wisdom_puzzles",
        "winam_checkmate_puzzles",
        "winam_platform_config",
        "winam_payments",
        "winam_winners",
        "winam_kyc",
        "winam_puzzle_attempts",
        "winam_entry_ledger",
        "winam_player_missions",
        "winam_game_sessions",
        "winam_missions",
        "winam_otp_sessions",
        "winam_subscriptions",
        "winam_players",
        "winam_draw_weeks",
        "winam_banners",
        "winam_admin_audit_log",
        "winam_admin_users",
    ]:
        op.drop_table(table)

    bind = op.get_bind()
    for enum in [
        subscription_status,
        subscription_plan,
        reward_type,
        rank_tier,
        puzzle_result,
        mission_status,
        mission_condition_type,
        game_type,
        entry_source_type,
        draw_week_status,
    ]:
        enum.drop(bind, checkfirst=True)
