from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.kyc import get_kyc_status, submit_bank_details, submit_identity

router = APIRouter()


class IdentityPayload(BaseModel):
    player_id: str
    first_name: str
    last_name: str
    dob: str
    id_type: str
    id_number: str


class BankPayload(BaseModel):
    player_id: str
    bank_code: str
    bank_name: str
    account_number: str
    account_name: str | None = None


@router.get("/status")
def kyc_status(player_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
    result = get_kyc_status(db, player_id)
    kyc = result.get("kyc")
    if not kyc:
        return {"kyc": None}
    return {
        "kyc": {
            "id": kyc.id,
            "player_id": kyc.player_id,
            "first_name": kyc.first_name,
            "last_name": kyc.last_name,
            "dob": kyc.dob,
            "id_type": kyc.id_type,
            "id_number": kyc.id_number,
            "bank_code": kyc.bank_code,
            "bank_name": kyc.bank_name,
            "account_number": kyc.account_number,
            "account_name": kyc.account_name,
            "submitted_at": kyc.submitted_at.isoformat() if kyc.submitted_at else None,
            "bank_details_submitted_at": kyc.bank_details_submitted_at.isoformat() if kyc.bank_details_submitted_at else None,
            "verified": bool(kyc.verified),
        }
    }


@router.post("/identity")
def submit_identity_route(payload: IdentityPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        return submit_identity(
            db,
            payload.player_id,
            payload.first_name,
            payload.last_name,
            payload.dob,
            payload.id_type,
            payload.id_number,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/bank")
def submit_bank_route(payload: BankPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        return submit_bank_details(
            db,
            payload.player_id,
            payload.bank_code,
            payload.bank_name,
            payload.account_number,
            payload.account_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
