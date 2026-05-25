from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.enums import RankTier, SubscriptionStatus
from app.domain.models import (
    WinamBanner,
    WinamEntryLedger,
    WinamKyc,
    WinamMission,
    WinamPayment,
    WinamPlayer,
    WinamSubscription,
    WinamWinner,
)
from app.services.admin_auth import verify_admin_session
from app.services.draws import wat_now
from app.services.session_tokens import ADMIN_SESSION_COOKIE, require_session_subject

router = APIRouter()


def _assert_admin(request: Request, db: Session, admin_id: str) -> None:
    require_session_subject(
        request,
        cookie_name=ADMIN_SESSION_COOKIE,
        expected_kind="admin",
        provided_subject=admin_id,
    )
    if not verify_admin_session(db, admin_id).get("valid"):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _audit(db: Session, admin_id: str, action: str, target_type: str | None, target_id: str | None, details: dict) -> None:
    from app.domain.models import WinamAdminAuditLog

    db.add(
        WinamAdminAuditLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )
    )
    db.commit()


class FlagPlayerPayload(BaseModel):
    admin_id: str
    player_id: str
    flagged: bool
    reason: str


class AdjustCoinsPayload(BaseModel):
    admin_id: str
    player_id: str
    amount: int
    reason: str


class AdjustXpPayload(BaseModel):
    admin_id: str
    player_id: str
    amount: int
    reason: str


class UpdateSubscriptionPayload(BaseModel):
    admin_id: str
    player_id: str
    action: str
    days: int | None = None
    reason: str


class BannerPayload(BaseModel):
    admin_id: str
    title: str
    subtitle: str
    icon_url: str | None = None
    is_active: bool
    display_order: int


class BannerUpdatePayload(BaseModel):
    admin_id: str
    banner_id: str
    title: str | None = None
    subtitle: str | None = None
    icon_url: str | None = None
    is_active: bool | None = None
    display_order: int | None = None


class DeleteBannerPayload(BaseModel):
    admin_id: str
    banner_id: str


class MissionPayload(BaseModel):
    admin_id: str
    title: str
    game_type: str | None
    condition_type: str
    condition_value: int
    reward_type: str
    reward_amount: int
    is_active: bool


class MissionUpdatePayload(BaseModel):
    admin_id: str
    mission_id: str
    title: str | None = None
    game_type: str | None = None
    condition_type: str | None = None
    condition_value: int | None = None
    reward_type: str | None = None
    reward_amount: int | None = None
    is_active: bool | None = None


class ConfigPayload(BaseModel):
    admin_id: str
    key: str
    value: object


class KycVerifyPayload(BaseModel):
    admin_id: str
    player_id: str


class PaymentCreatePayload(BaseModel):
    admin_id: str
    player_id: str
    winner_id: str
    draw_week_id: str
    amount_naira: int
    prize_type: str


class PaymentMarkPayload(BaseModel):
    admin_id: str
    payment_id: str
    player_id: str


@router.post("/players/flag")
def flag_player(payload: FlagPlayerPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == payload.player_id)).scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    player.is_flagged = payload.flagged
    player.flag_reason = payload.reason if payload.flagged else None
    db.commit()
    _audit(db, payload.admin_id, "player_flag" if payload.flagged else "player_unflag", "player", payload.player_id, {"reason": payload.reason})
    return {"success": True}


@router.post("/players/coins")
def adjust_coins(payload: AdjustCoinsPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == payload.player_id)).scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    next_balance = max(0, (player.coin_balance or 0) + payload.amount)
    player.coin_balance = next_balance
    db.commit()
    _audit(db, payload.admin_id, "player_adjust_coins", "player", payload.player_id, {"amount": payload.amount, "reason": payload.reason, "after": next_balance})
    return {"success": True, "newBalance": next_balance}


@router.post("/players/xp")
def adjust_xp(payload: AdjustXpPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == payload.player_id)).scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    next_xp = max(0, (player.xp_total or 0) + payload.amount)
    if next_xp >= 10000:
        tier = RankTier.immortal
    elif next_xp >= 7000:
        tier = RankTier.legend
    elif next_xp >= 4500:
        tier = RankTier.icon
    elif next_xp >= 2500:
        tier = RankTier.champion
    elif next_xp >= 1200:
        tier = RankTier.veteran
    elif next_xp >= 500:
        tier = RankTier.sergeant
    elif next_xp >= 150:
        tier = RankTier.recruit
    else:
        tier = RankTier.starter
    player.xp_total = next_xp
    player.rank_tier = tier
    db.commit()
    _audit(db, payload.admin_id, "player_adjust_xp", "player", payload.player_id, {"amount": payload.amount, "reason": payload.reason, "after": next_xp, "tier": tier.value})
    return {"success": True, "newXP": next_xp, "newTier": tier.value}


@router.post("/subscriptions/update")
def update_subscription(payload: UpdateSubscriptionPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    sub = db.execute(
        select(WinamSubscription)
        .where(WinamSubscription.player_id == payload.player_id)
        .order_by(WinamSubscription.valid_from.desc())
        .limit(1)
    ).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")
    if payload.action == "cancel":
        sub.status = SubscriptionStatus.cancelled
        db.commit()
        _audit(db, payload.admin_id, "subscription_cancel", "subscription", sub.id, {"reason": payload.reason})
        return {"success": True}
    days = payload.days or 7
    base = sub.valid_until or wat_now()
    next_until = base + timedelta(days=days)
    sub.status = SubscriptionStatus.active
    sub.valid_until = next_until
    db.commit()
    _audit(db, payload.admin_id, "subscription_extend", "subscription", sub.id, {"days": days, "reason": payload.reason, "newValidUntil": next_until.isoformat()})
    return {"success": True, "newValidUntil": next_until.isoformat()}


@router.get("/banners")
def banners(admin_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    rows = list(db.execute(select(WinamBanner).order_by(WinamBanner.display_order.asc())).scalars())
    return {
        "banners": [
            {
                "id": row.id,
                "title": row.title,
                "subtitle": row.subtitle,
                "icon_url": row.icon_url,
                "is_active": row.is_active,
                "display_order": row.display_order,
            }
            for row in rows
        ]
    }


@router.post("/banners/create")
def create_banner(payload: BannerPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    row = WinamBanner(title=payload.title, subtitle=payload.subtitle, icon_url=payload.icon_url, is_active=payload.is_active, display_order=payload.display_order)
    db.add(row)
    db.commit()
    db.refresh(row)
    _audit(db, payload.admin_id, "banner_create", "banner", row.id, {"title": payload.title})
    return {"banner": {"id": row.id}}


@router.post("/banners/update")
def update_banner(payload: BannerUpdatePayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    row = db.execute(select(WinamBanner).where(WinamBanner.id == payload.banner_id)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Banner not found")
    if payload.title is not None:
        row.title = payload.title
    if payload.subtitle is not None:
        row.subtitle = payload.subtitle
    if payload.icon_url is not None:
        row.icon_url = payload.icon_url
    if payload.is_active is not None:
        row.is_active = payload.is_active
    if payload.display_order is not None:
        row.display_order = payload.display_order
    db.commit()
    _audit(db, payload.admin_id, "banner_update", "banner", payload.banner_id, payload.model_dump(exclude={"admin_id", "banner_id"}))
    return {"success": True}


@router.post("/banners/delete")
def delete_banner(payload: DeleteBannerPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    row = db.execute(select(WinamBanner).where(WinamBanner.id == payload.banner_id)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Banner not found")
    db.delete(row)
    db.commit()
    _audit(db, payload.admin_id, "banner_delete", "banner", payload.banner_id, {})
    return {"success": True}


@router.post("/missions/create")
def create_mission(payload: MissionPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    row = WinamMission(
        title=payload.title,
        game_type=payload.game_type,
        condition_type=payload.condition_type,
        condition_value=payload.condition_value,
        reward_type=payload.reward_type,
        reward_amount=payload.reward_amount,
        is_active=payload.is_active,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    _audit(db, payload.admin_id, "mission_create", "mission", row.id, {"title": payload.title})
    return {"mission": {"id": row.id}}


@router.post("/missions/update")
def update_mission(payload: MissionUpdatePayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    row = db.execute(select(WinamMission).where(WinamMission.id == payload.mission_id)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Mission not found")
    for field in ["title", "game_type", "condition_type", "condition_value", "reward_type", "reward_amount", "is_active"]:
        value = getattr(payload, field)
        if value is not None:
            setattr(row, field, value)
    db.commit()
    _audit(db, payload.admin_id, "mission_update", "mission", payload.mission_id, payload.model_dump(exclude={"admin_id", "mission_id"}))
    return {"success": True}


@router.post("/config/update")
def update_config(payload: ConfigPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    from app.domain.models import WinamPlatformConfig

    row = db.execute(select(WinamPlatformConfig).where(WinamPlatformConfig.key == payload.key)).scalar_one_or_none()
    if not row:
        row = WinamPlatformConfig(key=payload.key, value=payload.value, updated_by=payload.admin_id)
        db.add(row)
    else:
        row.value = payload.value
        row.updated_by = payload.admin_id
        row.updated_at = datetime.now(timezone.utc)
    db.commit()
    _audit(db, payload.admin_id, "config_update", "config", payload.key, {"value": payload.value})
    return {"success": True}


@router.post("/kyc/verify")
def verify_kyc(payload: KycVerifyPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    row = db.execute(select(WinamKyc).where(WinamKyc.player_id == payload.player_id)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="KYC not found")
    row.verified = True
    row.verified_at = datetime.now(timezone.utc)
    row.verified_by = payload.admin_id
    db.commit()
    _audit(db, payload.admin_id, "kyc_verify", "player", payload.player_id, {})
    return {"success": True}


@router.post("/payments/create")
def create_payment(payload: PaymentCreatePayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    row = WinamPayment(
        player_id=payload.player_id,
        winner_id=payload.winner_id,
        draw_week_id=payload.draw_week_id,
        amount_naira=payload.amount_naira,
        prize_type=payload.prize_type,
        status="pending",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    _audit(db, payload.admin_id, "payment_create", "player", payload.player_id, {"winnerId": payload.winner_id, "amountNaira": payload.amount_naira})
    return {"success": True, "paymentId": row.id}


@router.post("/payments/mark-paid")
def mark_paid(payload: PaymentMarkPayload, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, payload.admin_id)
    row = db.execute(select(WinamPayment).where(WinamPayment.id == payload.payment_id)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Payment not found")
    row.status = "paid"
    row.paid_at = datetime.now(timezone.utc)
    row.paid_by = payload.admin_id
    db.commit()
    _audit(db, payload.admin_id, "payment_mark_paid", "player", payload.player_id, {"paymentId": payload.payment_id})
    return {"success": True}
