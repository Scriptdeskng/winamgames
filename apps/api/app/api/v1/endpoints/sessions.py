from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import SessionCloseRequest, StartSessionRequest
from app.services.gameplay import close_game_session, start_game_session, submit_puzzle_move, use_hint

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
def start_session(payload: StartSessionRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    return start_game_session(db, payload.player_id, payload.game_type)


@router.post("/move")
def move_session(payload: MoveRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    return submit_puzzle_move(db, payload.session_id, payload.puzzle_id, payload.answer, payload.time_ms, payload.next_puzzle_id)


@router.post("/hint")
def hint_session(payload: HintRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    return use_hint(db, payload.player_id, payload.puzzle_id, payload.tier)


@router.post("/close")
def close_session(payload: SessionCloseRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    return close_game_session(db, payload)
