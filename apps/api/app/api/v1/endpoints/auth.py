from datetime import timedelta

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.enums import SubscriptionPlan
from app.domain.models import WinamPlayer
from app.schemas.common import LoginRequest
from app.services.auth import get_player_subscription_status, renew_subscription, send_otp, set_nickname, verify_otp
from app.services.session_tokens import (
    PLAYER_SESSION_COOKIE,
    create_session_token,
    require_session_subject,
    verify_session_token,
)
from app.core.config import settings
from app.services.draws import wat_now

router = APIRouter()


class RenewPayload(BaseModel):
    player_id: str
    plan: SubscriptionPlan


def _player_cookie_kwargs() -> dict[str, object]:
    return {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "path": "/",
        "max_age": int(timedelta(days=30).total_seconds()),
    }


def _serialize_player_session(db: Session, player_id: str) -> dict[str, object] | None:
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        return None
    return {
        "id": player.id,
        "nickname": player.nickname,
        "msisdnLast4": player.msisdn_last4,
        "coinBalance": player.coin_balance,
        "xpTotal": player.xp_total,
        "currentStreak": player.current_streak,
        "rankTier": player.rank_tier.value,
        "createdAt": player.created_at.isoformat() if player.created_at else wat_now().isoformat(),
    }


@router.post("/send-otp")
def send_otp_route(payload: dict[str, str], db: Session = Depends(get_db)) -> dict[str, object]:
    return send_otp(db, payload["msisdn"])


@router.post("/verify")
def verify_otp_route(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> dict[str, object]:
    result = verify_otp(db, payload.msisdn, payload.otp)
    if result.get("success") and result.get("playerId"):
        token = create_session_token(str(result["playerId"]), "player")
        response.set_cookie(PLAYER_SESSION_COOKIE, token, **_player_cookie_kwargs())
    return result


@router.post("/nickname")
def nickname_route(payload: dict[str, str], request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
        provided_subject=payload["playerId"],
    )
    return set_nickname(db, payload["playerId"], payload["nickname"])


@router.post("/renew")
def renew_route(payload: RenewPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
        provided_subject=payload.player_id,
    )
    return renew_subscription(db, payload.player_id, payload.plan)


@router.get("/subscription-status")
def subscription_status_route(player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
        provided_subject=player_id,
    )
    return get_player_subscription_status(db, player_id)


@router.get("/session")
def session_route(request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    token = request.cookies.get(PLAYER_SESSION_COOKIE)
    if not token:
        return {"valid": False}
    payload = verify_session_token(token, "player")
    if not payload:
        return {"valid": False}
    player = _serialize_player_session(db, str(payload["sub"]))
    if not player:
        return {"valid": False}
    return {
        "valid": True,
        "player": player,
        "expiresAt": payload["exp"],
    }


@router.post("/logout")
def logout_route(response: Response) -> dict[str, object]:
    response.delete_cookie(PLAYER_SESSION_COOKIE, path="/")
    return {"success": True}
