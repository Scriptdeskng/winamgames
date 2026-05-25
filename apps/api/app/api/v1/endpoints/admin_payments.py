from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.models import WinamPayment
from app.services.kyc import create_payment_record, get_payments_for_player, mark_payment_paid
from app.services.admin_auth import verify_admin_session
from app.services.session_tokens import ADMIN_SESSION_COOKIE, require_session_subject

router = APIRouter()


class CreatePaymentPayload(BaseModel):
    admin_id: str
    player_id: str
    winner_id: str
    draw_week_id: str
    amount_naira: int
    prize_type: str


class MarkPaidPayload(BaseModel):
    admin_id: str
    payment_id: str
    player_id: str


def _serialize_payment(payment: WinamPayment) -> dict[str, object]:
    return {
        "id": payment.id,
        "player_id": payment.player_id,
        "winner_id": payment.winner_id,
        "draw_week_id": payment.draw_week_id,
        "amount_naira": payment.amount_naira,
        "prize_type": payment.prize_type,
        "status": payment.status,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        "paid_by": payment.paid_by,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
        "updated_at": payment.updated_at.isoformat() if payment.updated_at else None,
    }


@router.get("")
def list_payments(admin_id: str, player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=ADMIN_SESSION_COOKIE,
        expected_kind="admin",
        provided_subject=admin_id,
    )
    if not verify_admin_session(db, admin_id).get("valid"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"payments": [_serialize_payment(payment) for payment in get_payments_for_player(db, player_id)]}


@router.post("/create")
def create_payment(payload: CreatePaymentPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=ADMIN_SESSION_COOKIE,
        expected_kind="admin",
        provided_subject=payload.admin_id,
    )
    if not verify_admin_session(db, payload.admin_id).get("valid"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        return create_payment_record(
            db,
            payload.admin_id,
            payload.player_id,
            payload.winner_id,
            payload.draw_week_id,
            payload.amount_naira,
            payload.prize_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/mark-paid")
def mark_paid(payload: MarkPaidPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=ADMIN_SESSION_COOKIE,
        expected_kind="admin",
        provided_subject=payload.admin_id,
    )
    if not verify_admin_session(db, payload.admin_id).get("valid"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        return mark_payment_paid(db, payload.payment_id, payload.admin_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
