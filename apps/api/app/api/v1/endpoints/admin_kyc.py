from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.models import WinamKyc
from app.services.kyc import verify_kyc
from app.services.admin_auth import verify_admin_session
from app.services.session_tokens import ADMIN_SESSION_COOKIE, require_session_subject

router = APIRouter()


class VerifyKycPayload(BaseModel):
    admin_id: str
    player_id: str


def _serialize_kyc(kyc: WinamKyc | None) -> dict[str, object] | None:
    if not kyc:
        return None
    return {
        "id": kyc.id,
        "player_id": kyc.player_id,
        "first_name": kyc.first_name,
        "last_name": kyc.last_name,
        "dob": kyc.dob,
        "id_type": kyc.id_type,
        "id_number": kyc.id_number,
        "bank_name": kyc.bank_name,
        "bank_code": kyc.bank_code,
        "account_name": kyc.account_name,
        "account_number": kyc.account_number,
        "submitted_at": kyc.submitted_at.isoformat() if kyc.submitted_at else None,
        "bank_details_submitted_at": kyc.bank_details_submitted_at.isoformat() if kyc.bank_details_submitted_at else None,
        "verified": kyc.verified,
        "verified_at": kyc.verified_at.isoformat() if kyc.verified_at else None,
        "verified_by": kyc.verified_by,
    }


@router.get("")
def get_kyc_for_player(admin_id: str, player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=ADMIN_SESSION_COOKIE,
        expected_kind="admin",
        provided_subject=admin_id,
    )
    if not verify_admin_session(db, admin_id).get("valid"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    kyc = db.execute(select(WinamKyc).where(WinamKyc.player_id == player_id)).scalar_one_or_none()
    return {"kyc": _serialize_kyc(kyc)}


@router.post("/verify")
def verify_kyc_route(payload: VerifyKycPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=ADMIN_SESSION_COOKIE,
        expected_kind="admin",
        provided_subject=payload.admin_id,
    )
    if not verify_admin_session(db, payload.admin_id).get("valid"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        return verify_kyc(db, payload.player_id, payload.admin_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
