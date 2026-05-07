from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.models import WinamWinner
from app.services.admin_auth import verify_admin_session

router = APIRouter()


class FlagWinnerPayload(BaseModel):
    admin_id: str
    winner_id: str
    flagged: bool


def _assert_admin(db: Session, admin_id: str) -> None:
    if not verify_admin_session(db, admin_id).get("valid"):
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("")
def list_winners(admin_id: str, draw_week_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(db, admin_id)
    rows = list(
        db.execute(
            select(WinamWinner)
            .where(WinamWinner.draw_week_id == draw_week_id)
            .order_by(WinamWinner.position.asc())
        ).scalars()
    )
    return {
        "winners": [
            {
                "id": row.id,
                "draw_week_id": row.draw_week_id,
                "player_id": row.player_id,
                "position": row.position,
                "prize_type": row.prize_type,
                "prize_amount": row.prize_amount,
                "ticket_id": row.ticket_id,
                "is_flagged": row.is_flagged,
            }
            for row in rows
        ]
    }


@router.post("/flag")
def flag_winner(payload: FlagWinnerPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(db, payload.admin_id)
    winner = db.execute(select(WinamWinner).where(WinamWinner.id == payload.winner_id)).scalar_one_or_none()
    if not winner:
        raise HTTPException(status_code=404, detail="Winner not found")
    winner.is_flagged = payload.flagged
    db.commit()
    return {"success": True}
