from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.enums import SubscriptionPlan, SubscriptionStatus
from app.domain.models import WinamIntelliEvent, WinamPlayer, WinamSubscription
from app.services.draws import wat_now
from app.services.intelli import normalize_msisdn_for_intelli


WAT = timezone(timedelta(hours=1))


def _as_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=WAT)
    return parsed


def _parse_date_as_end_of_day(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=WAT)
    return parsed.replace(hour=23, minute=59, second=59, microsecond=999999)


def _latest_subscription(db: Session, player_id: str) -> WinamSubscription | None:
    return db.execute(
        select(WinamSubscription)
        .where(WinamSubscription.player_id == player_id)
        .order_by(WinamSubscription.valid_from.desc())
        .limit(1)
    ).scalar_one_or_none()


def _plan_from_dates(valid_from: datetime | None, valid_until: datetime | None) -> SubscriptionPlan:
    if valid_from is None or valid_until is None:
        return SubscriptionPlan.daily

    duration_days = (valid_until.date() - valid_from.date()).days
    if duration_days <= 1:
        return SubscriptionPlan.daily
    if duration_days <= 7:
        return SubscriptionPlan.weekly
    return SubscriptionPlan.monthly


def find_or_create_player(db: Session, msisdn: str) -> WinamPlayer:
    digits = normalize_msisdn_for_intelli(msisdn)
    last4 = digits[-4:]
    msisdn_hash = hashlib.sha256(f"+{digits}".encode("utf-8")).hexdigest()
    player = (
        db.execute(
            select(WinamPlayer)
            .where((WinamPlayer.msisdn == digits) | (WinamPlayer.msisdn_hash == msisdn_hash))
            .limit(1)
        ).scalar_one_or_none()
    )
    if not player:
        player = WinamPlayer(msisdn_hash=msisdn_hash, msisdn_last4=last4, msisdn=digits)
        db.add(player)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            player = (
                db.execute(
                    select(WinamPlayer)
                    .where((WinamPlayer.msisdn == digits) | (WinamPlayer.msisdn_hash == msisdn_hash))
                    .limit(1)
                ).scalar_one_or_none()
            )
            if not player:
                raise
        db.refresh(player)
        return player

    if player.msisdn != digits:
        player.msisdn = digits
    if player.msisdn_last4 != last4:
        player.msisdn_last4 = last4
    if player.msisdn_hash != msisdn_hash:
        player.msisdn_hash = msisdn_hash
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        player = (
            db.execute(
                select(WinamPlayer)
                .where((WinamPlayer.msisdn == digits) | (WinamPlayer.msisdn_hash == msisdn_hash))
                .limit(1)
            ).scalar_one_or_none()
        )
        if not player:
            raise
    db.refresh(player)
    return player


def sync_subscription_from_intelli(
    db: Session,
    msisdn: str,
    subscription_data: dict[str, Any] | None,
    *,
    has_active: bool,
    source: str,
) -> tuple[WinamPlayer, WinamSubscription | None]:
    player = find_or_create_player(db, msisdn)
    current = _latest_subscription(db, player.id)

    if has_active and subscription_data:
        valid_from = _parse_dt(subscription_data.get("starts_date")) or wat_now()
        valid_until = _parse_dt(subscription_data.get("ends_date")) or _parse_dt(subscription_data.get("expiry"))
        plan = _plan_from_dates(valid_from, valid_until)
        if valid_until is None:
            valid_until = valid_from.replace(hour=22, minute=59, second=59, microsecond=999999)
        carrier_ref = str(subscription_data.get("subscription_id") or subscription_data.get("telco_ref") or "")
        sub = current or WinamSubscription(player_id=player.id, plan=plan, status=SubscriptionStatus.active)
        sub.plan = plan
        sub.status = SubscriptionStatus.active
        sub.valid_from = valid_from
        sub.valid_until = valid_until
        sub.grace_until = None
        sub.last_billed_at = wat_now()
        sub.carrier_ref = carrier_ref or None
        if not current:
            db.add(sub)
        db.commit()
        db.refresh(sub)
        return player, sub

    if current:
        current.status = SubscriptionStatus.expired
        current.valid_until = _parse_dt(subscription_data.get("expiry")) if subscription_data else current.valid_until
        current.grace_until = None
        db.commit()
        db.refresh(current)
        return player, current

    sub = WinamSubscription(
        player_id=player.id,
        plan=SubscriptionPlan.daily,
        status=SubscriptionStatus.expired,
        valid_from=wat_now(),
        valid_until=_parse_dt(subscription_data.get("expiry")) if subscription_data else wat_now(),
        grace_until=None,
        carrier_ref=str(subscription_data.get("telco_ref") or "") if subscription_data else None,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return player, sub


def apply_intelli_notification(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    details = payload.get("details") if isinstance(payload.get("details"), dict) else {}
    product = payload.get("product") if isinstance(payload.get("product"), dict) else {}
    msisdn = str(details.get("phone") or "")
    if not msisdn:
        return {"success": False, "error": "Missing phone"}

    action_type = str(payload.get("type") or "")
    has_active = action_type != "UNSUBSCRIPTION_NOTIFICATION"
    player = find_or_create_player(db, msisdn)
    current = _latest_subscription(db, player.id)
    subscription_data = {
        "subscription_id": product.get("identity") or product.get("id"),
        "amount": details.get("amount"),
        "starts_date": details.get("date"),
        "ends_date": details.get("expiry"),
        "expiry": details.get("expiry"),
        "auto_renewal": details.get("auto_renewal"),
        "telco_ref": details.get("telco_ref"),
        "traffic_source": details.get("channel"),
    }
    player, sub = sync_subscription_from_intelli(
        db,
        msisdn,
        subscription_data,
        has_active=has_active,
        source=action_type,
    )
    db.add(
        WinamIntelliEvent(
            event_type=action_type,
            telco=_as_text(payload.get("telco")),
            action=_as_text(payload.get("action")),
            msisdn=msisdn,
            product_id=_as_text(product.get("identity") or product.get("id")),
            product_name=_as_text(product.get("name")),
            status=("active" if has_active else "inactive"),
            previous_status=current.status.value if current else None,
            new_status=sub.status.value if sub else None,
            changed_existing=bool(current is not None),
            auto_renewal=bool(details.get("auto_renewal")) if details.get("auto_renewal") is not None else None,
            telco_ref=_as_text(details.get("telco_ref")),
            payload=payload,
            player_id=player.id,
            subscription_id=sub.id if sub else None,
        )
    )
    db.commit()
    return {
        "success": True,
        "player_id": player.id,
        "subscription_id": sub.id if sub else None,
        "status": sub.status.value if sub else None,
    }
