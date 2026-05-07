from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.domain.enums import GameType


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class HealthResponse(APIModel):
    status: str


class ErrorResponse(APIModel):
    detail: str


class UUIDResponse(APIModel):
    id: str


class PlayerSummary(APIModel):
    id: str
    nickname: str | None = None
    msisdn_last4: str
    coin_balance: int = 0
    xp_total: int = 0
    current_streak: int = 0
    rank_tier: str = "starter"


class DrawWeekSummary(APIModel):
    id: str
    week_start_wat: date
    week_end_wat: date
    status: str
    entry_lock_at: datetime
    draw_executes_at: datetime
    total_entries: int = 0


class SessionCloseRequest(APIModel):
    player_id: str = Field(min_length=1)
    game_type: GameType | None = None
    session_id: str | None = None
    duration_seconds: int = 0
    puzzles_solved: int = 0
    hints_used: int = 0
    answer_payload: dict[str, Any] | None = None


class SessionCloseResponse(APIModel):
    session_id: str
    draw_week_id: str
    entries_awarded: int
    coins_awarded: int
    mission_completions: list[dict[str, Any]] = []


class StartSessionRequest(APIModel):
    player_id: str
    game_type: GameType


class StartSessionResponse(APIModel):
    session_id: str
    draw_week_id: str
    game_type: str


class LoginRequest(APIModel):
    msisdn: str
    otp: str


class LoginResponse(APIModel):
    player_id: str
    needs_onboarding: bool
    msisdn_last4: str
    access_token: str | None = None
