from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.domain.enums import (
    DrawWeekStatus,
    EntrySourceType,
    GameType,
    MissionConditionType,
    MissionStatus,
    PuzzleResult,
    RankTier,
    RewardType,
    SubscriptionPlan,
    SubscriptionStatus,
)


def uuid_pk() -> Mapped[str]:
    return mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))


class TimestampMixin:
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WinamAdminUser(Base, TimestampMixin):
    __tablename__ = "winam_admin_users"

    id: Mapped[str] = uuid_pk()
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'admin'"))

    audit_logs: Mapped[list["WinamAdminAuditLog"]] = relationship(back_populates="admin")


class WinamAdminAuditLog(Base):
    __tablename__ = "winam_admin_audit_log"

    id: Mapped[str] = uuid_pk()
    admin_id: Mapped[str | None] = mapped_column(ForeignKey("winam_admin_users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    target_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    details: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())

    admin: Mapped["WinamAdminUser | None"] = relationship(back_populates="audit_logs")


class WinamIntelliEvent(Base):
    __tablename__ = "winam_intelli_events"

    id: Mapped[str] = uuid_pk()
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    telco: Mapped[str | None] = mapped_column(String(20), nullable=True)
    action: Mapped[str | None] = mapped_column(String(40), nullable=True)
    msisdn: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    product_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    previous_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    new_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    changed_existing: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    auto_renewal: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    telco_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    player_id: Mapped[str | None] = mapped_column(ForeignKey("winam_players.id"), nullable=True, index=True)
    subscription_id: Mapped[str | None] = mapped_column(ForeignKey("winam_subscriptions.id"), nullable=True, index=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())

    player: Mapped["WinamPlayer | None"] = relationship()
    subscription: Mapped["WinamSubscription | None"] = relationship()


class WinamBanner(Base, TimestampMixin):
    __tablename__ = "winam_banners"

    id: Mapped[str] = uuid_pk()
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str] = mapped_column(String(255), nullable=False)
    icon_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))


class WinamDrawWeek(Base):
    __tablename__ = "winam_draw_weeks"

    id: Mapped[str] = uuid_pk()
    week_start_wat: Mapped[date] = mapped_column(Date, nullable=False)
    week_end_wat: Mapped[date] = mapped_column(Date, nullable=False)
    entry_lock_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    draw_executes_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[DrawWeekStatus] = mapped_column(Enum(DrawWeekStatus, name="draw_week_status"), nullable=False, default=DrawWeekStatus.open)
    total_entries: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    draw_seed: Mapped[str | None] = mapped_column(String(128), nullable=True)

    entries: Mapped[list["WinamEntryLedger"]] = relationship(back_populates="draw_week")
    sessions: Mapped[list["WinamGameSession"]] = relationship(back_populates="draw_week")
    winners: Mapped[list["WinamWinner"]] = relationship(back_populates="draw_week")
    payments: Mapped[list["WinamPayment"]] = relationship(back_populates="draw_week")

    __table_args__ = (
        UniqueConstraint("week_start_wat", name="uq_winam_draw_weeks_week_start_wat"),
    )


class WinamPlayer(Base, TimestampMixin):
    __tablename__ = "winam_players"

    id: Mapped[str] = uuid_pk()
    msisdn_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    msisdn: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True, index=True)
    msisdn_last4: Mapped[str] = mapped_column(String(4), nullable=False)
    nickname: Mapped[str | None] = mapped_column(String(40), nullable=True, unique=True)
    avatar_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    coin_balance: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    xp_total: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    current_streak: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    rank_tier: Mapped[RankTier] = mapped_column(Enum(RankTier, name="rank_tier"), nullable=False, default=RankTier.starter)
    device_fingerprint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    flag_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_session_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    subscriptions: Mapped[list["WinamSubscription"]] = relationship(back_populates="player")
    sessions: Mapped[list["WinamGameSession"]] = relationship(back_populates="player")
    entries: Mapped[list["WinamEntryLedger"]] = relationship(back_populates="player")
    missions: Mapped[list["WinamPlayerMission"]] = relationship(back_populates="player")
    kyc: Mapped["WinamKyc | None"] = relationship(back_populates="player", uselist=False)
    winners: Mapped[list["WinamWinner"]] = relationship(back_populates="player")
    payments: Mapped[list["WinamPayment"]] = relationship(back_populates="player")


class WinamSubscription(Base, TimestampMixin):
    __tablename__ = "winam_subscriptions"

    id: Mapped[str] = uuid_pk()
    player_id: Mapped[str] = mapped_column(ForeignKey("winam_players.id"), nullable=False, index=True)
    plan: Mapped[SubscriptionPlan] = mapped_column(Enum(SubscriptionPlan, name="subscription_plan"), nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(Enum(SubscriptionStatus, name="subscription_status"), nullable=False, default=SubscriptionStatus.active)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    grace_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_billed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    carrier_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)

    player: Mapped["WinamPlayer"] = relationship(back_populates="subscriptions")


class WinamGameSession(Base):
    __tablename__ = "winam_game_sessions"

    id: Mapped[str] = uuid_pk()
    player_id: Mapped[str] = mapped_column(ForeignKey("winam_players.id"), nullable=False, index=True)
    draw_week_id: Mapped[str] = mapped_column(ForeignKey("winam_draw_weeks.id"), nullable=False, index=True)
    game_type: Mapped[GameType] = mapped_column(Enum(GameType, name="game_type"), nullable=False)
    session_date_wat: Mapped[date] = mapped_column(Date, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    puzzles_solved: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    hints_used: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    entries_awarded: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    coins_awarded: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    is_free_session: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    wisdom_accuracy: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    player: Mapped["WinamPlayer"] = relationship(back_populates="sessions")
    draw_week: Mapped["WinamDrawWeek"] = relationship(back_populates="sessions")
    attempts: Mapped[list["WinamPuzzleAttempt"]] = relationship(back_populates="session")


class WinamPuzzleAttempt(Base, TimestampMixin):
    __tablename__ = "winam_puzzle_attempts"

    id: Mapped[str] = uuid_pk()
    session_id: Mapped[str] = mapped_column(ForeignKey("winam_game_sessions.id"), nullable=False, index=True)
    puzzle_id: Mapped[str] = mapped_column(String(128), nullable=False)
    result: Mapped[PuzzleResult] = mapped_column(Enum(PuzzleResult, name="puzzle_result"), nullable=False)
    time_to_solve_ms: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    moves_submitted: Mapped[list[str]] = mapped_column(JSON, nullable=False, server_default=text("'[]'"))

    session: Mapped["WinamGameSession"] = relationship(back_populates="attempts")


class WinamEntryLedger(Base, TimestampMixin):
    __tablename__ = "winam_entry_ledger"

    id: Mapped[str] = uuid_pk()
    player_id: Mapped[str] = mapped_column(ForeignKey("winam_players.id"), nullable=False, index=True)
    draw_week_id: Mapped[str] = mapped_column(ForeignKey("winam_draw_weeks.id"), nullable=False, index=True)
    source_type: Mapped[EntrySourceType] = mapped_column(Enum(EntrySourceType, name="entry_source_type"), nullable=False)
    source_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    entries_delta: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    cap_overflow: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    week_total_after: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))

    player: Mapped["WinamPlayer"] = relationship(back_populates="entries")
    draw_week: Mapped["WinamDrawWeek"] = relationship(back_populates="entries")


class WinamMission(Base):
    __tablename__ = "winam_missions"

    id: Mapped[str] = uuid_pk()
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    condition_type: Mapped[MissionConditionType] = mapped_column(Enum(MissionConditionType, name="mission_condition_type"), nullable=False)
    condition_value: Mapped[int] = mapped_column(Integer, nullable=False)
    reward_type: Mapped[RewardType] = mapped_column(Enum(RewardType, name="reward_type"), nullable=False)
    reward_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    game_type: Mapped[GameType | None] = mapped_column(Enum(GameType, name="game_type"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))

    player_missions: Mapped[list["WinamPlayerMission"]] = relationship(back_populates="mission")


class WinamPlayerMission(Base):
    __tablename__ = "winam_player_missions"

    id: Mapped[str] = uuid_pk()
    player_id: Mapped[str] = mapped_column(ForeignKey("winam_players.id"), nullable=False, index=True)
    mission_id: Mapped[str] = mapped_column(ForeignKey("winam_missions.id"), nullable=False, index=True)
    draw_week_id: Mapped[str] = mapped_column(ForeignKey("winam_draw_weeks.id"), nullable=False, index=True)
    status: Mapped[MissionStatus] = mapped_column(Enum(MissionStatus, name="mission_status"), nullable=False, default=MissionStatus.pending)
    progress_current: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    entries_awarded: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    assigned_date_wat: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    player: Mapped["WinamPlayer"] = relationship(back_populates="missions")
    mission: Mapped["WinamMission"] = relationship(back_populates="player_missions")


class WinamKyc(Base):
    __tablename__ = "winam_kyc"

    id: Mapped[str] = uuid_pk()
    player_id: Mapped[str] = mapped_column(ForeignKey("winam_players.id"), nullable=False, unique=True)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    dob: Mapped[str] = mapped_column(String(20), nullable=False)
    id_type: Mapped[str] = mapped_column(String(50), nullable=False)
    id_number: Mapped[str] = mapped_column(String(120), nullable=False)
    bank_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    bank_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    account_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    bank_details_submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by: Mapped[str | None] = mapped_column(ForeignKey("winam_admin_users.id"), nullable=True)

    player: Mapped["WinamPlayer"] = relationship(back_populates="kyc")


class WinamWinner(Base, TimestampMixin):
    __tablename__ = "winam_winners"

    id: Mapped[str] = uuid_pk()
    draw_week_id: Mapped[str | None] = mapped_column(ForeignKey("winam_draw_weeks.id"), nullable=True, index=True)
    player_id: Mapped[str | None] = mapped_column(ForeignKey("winam_players.id"), nullable=True, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    prize_type: Mapped[str] = mapped_column(String(50), nullable=False)
    prize_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    ticket_id: Mapped[str] = mapped_column(String(80), nullable=False)
    is_flagged: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    player: Mapped["WinamPlayer | None"] = relationship(back_populates="winners")
    draw_week: Mapped["WinamDrawWeek | None"] = relationship(back_populates="winners")


class WinamPayment(Base, TimestampMixin):
    __tablename__ = "winam_payments"

    id: Mapped[str] = uuid_pk()
    player_id: Mapped[str] = mapped_column(ForeignKey("winam_players.id"), nullable=False, index=True)
    winner_id: Mapped[str] = mapped_column(ForeignKey("winam_winners.id"), nullable=False, index=True)
    draw_week_id: Mapped[str] = mapped_column(ForeignKey("winam_draw_weeks.id"), nullable=False, index=True)
    amount_naira: Mapped[int] = mapped_column(Integer, nullable=False)
    prize_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_by: Mapped[str | None] = mapped_column(ForeignKey("winam_admin_users.id"), nullable=True)

    player: Mapped["WinamPlayer"] = relationship(back_populates="payments")
    draw_week: Mapped["WinamDrawWeek"] = relationship(back_populates="payments")


class WinamOtpSession(Base, TimestampMixin):
    __tablename__ = "winam_otp_sessions"

    id: Mapped[str] = uuid_pk()
    msisdn_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))


class WinamPlatformConfig(Base):
    __tablename__ = "winam_platform_config"

    key: Mapped[str] = mapped_column(String(120), primary_key=True)
    value: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[str | None] = mapped_column(String(36), nullable=True)


class WinamCheckmatePuzzle(Base, TimestampMixin):
    __tablename__ = "winam_checkmate_puzzles"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    fen: Mapped[str] = mapped_column(String(500), nullable=False)
    solution_move: Mapped[str] = mapped_column(String(40), nullable=False)
    theme: Mapped[str] = mapped_column(String(120), nullable=False)
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    hint_piece: Mapped[str | None] = mapped_column(String(20), nullable=True)
    hint_destination: Mapped[str | None] = mapped_column(String(20), nullable=True)
    opponent_from: Mapped[str | None] = mapped_column(String(20), nullable=True)
    opponent_to: Mapped[str | None] = mapped_column(String(20), nullable=True)
    times_served: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))


class WinamWisdomPuzzle(Base, TimestampMixin):
    __tablename__ = "winam_wisdom_puzzles"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    display_text: Mapped[str] = mapped_column(String(500), nullable=False)
    original_proverb: Mapped[str] = mapped_column(String(500), nullable=False)
    blank: Mapped[str] = mapped_column(String(120), nullable=False)
    region: Mapped[str] = mapped_column(String(120), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(40), nullable=False)
    options: Mapped[list[str] | dict[str, Any]] = mapped_column(JSON, nullable=False)
    correct_index: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[str | None] = mapped_column(String(500), nullable=True)
