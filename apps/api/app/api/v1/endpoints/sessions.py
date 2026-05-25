from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.models import WinamGameSession
from app.schemas.common import SessionCloseRequest, StartSessionRequest
from app.services.gameplay import close_game_session, start_game_session, submit_puzzle_move, use_hint
from app.services.session_tokens import PLAYER_SESSION_COOKIE, require_session_subject

router = APIRouter()


class MoveRequest(BaseModel):
    session_id: str
    puzzle_id: str
    answer: str
    time_ms: int
    next_puzzle_id: str | None = None


class HintRequest(BaseModel):
    player_id: str
    puzzle_id: str
    tier: int


@router.post("/start")
def start_session(payload: StartSessionRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
        provided_subject=payload.player_id,
    )
    return start_game_session(db, payload.player_id, payload.game_type)


@router.post("/move")
def move_session(payload: MoveRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    player_id = require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
    )
    session = db.execute(select(WinamGameSession).where(WinamGameSession.id == payload.session_id)).scalar_one_or_none()
    if not session or session.player_id != player_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return submit_puzzle_move(db, payload.session_id, payload.puzzle_id, payload.answer, payload.time_ms, payload.next_puzzle_id)


@router.post("/hint")
def hint_session(payload: HintRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
        provided_subject=payload.player_id,
    )
    return use_hint(db, payload.player_id, payload.puzzle_id, payload.tier)


@router.post("/close")
def close_session(payload: SessionCloseRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
        provided_subject=payload.player_id,
    )
    return close_game_session(db, payload)
