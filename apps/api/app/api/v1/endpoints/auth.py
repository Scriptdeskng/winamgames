from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.enums import SubscriptionPlan
from app.schemas.common import LoginRequest
from app.services.auth import get_player_subscription_status, renew_subscription, send_otp, set_nickname, verify_otp

router = APIRouter()


class RenewPayload(BaseModel):
    player_id: str
    plan: SubscriptionPlan


@router.post("/send-otp")
def send_otp_route(payload: dict[str, str], db: Session = Depends(get_db)) -> dict[str, object]:
    return send_otp(db, payload["msisdn"])


@router.post("/verify")
def verify_otp_route(payload: LoginRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    return verify_otp(db, payload.msisdn, payload.otp)


@router.post("/nickname")
def nickname_route(payload: dict[str, str], db: Session = Depends(get_db)) -> dict[str, object]:
    return set_nickname(db, payload["playerId"], payload["nickname"])


@router.post("/renew")
def renew_route(payload: RenewPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    return renew_subscription(db, payload.player_id, payload.plan)


@router.get("/subscription-status")
def subscription_status_route(player_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
    return get_player_subscription_status(db, player_id)
