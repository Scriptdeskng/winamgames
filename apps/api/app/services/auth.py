from __future__ import annotations

import hashlib
import re
from datetime import timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.enums import SubscriptionPlan, SubscriptionStatus
from app.domain.models import WinamOtpSession, WinamPlayer, WinamSubscription
from app.services.draws import wat_now
from app.services.intelli import is_mock_mode, normalize_msisdn_for_intelli, send_otp as intelli_send_otp, subscription_status as intelli_subscription_status, verify_otp as intelli_verify_otp
from app.services.subscriptions import sync_subscription_from_intelli


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_msisdn(raw: str) -> str:
    cleaned = re.sub(r"[\s-]+", "", raw)
    if cleaned.startswith("0"):
        cleaned = "+234" + cleaned[1:]
    elif cleaned.startswith("234"):
        cleaned = "+" + cleaned
    if not cleaned.startswith("+234"):
        raise ValueError("Please enter a valid Nigerian mobile number")
    if not re.match(r"^\+234[789]\d{9}$", cleaned):
        raise ValueError("Please enter a valid Nigerian mobile number (e.g. 0813 749 8991)")
    return cleaned


def _local_mock_send_otp(db: Session, msisdn: str) -> dict[str, object]:
    normalized = normalize_msisdn(msisdn)
    last4 = normalized[-4:]
    otp = "0000"
    db.add(
        WinamOtpSession(
            msisdn_hash=sha256(normalized),
            code_hash=sha256(otp),
            expires_at=wat_now() + timedelta(minutes=10),
            used=False,
        )
    )
    db.commit()
    return {"success": True, "message": f"OTP sent successfully to {normalized}", "msisdnLast4": last4}


def _upsert_player(db: Session, msisdn: str) -> tuple[WinamPlayer, bool]:
    digits = normalize_msisdn_for_intelli(msisdn)
    msisdn_hash = sha256(f"+{digits}")
    last4 = digits[-4:]
    player = (
        db.execute(
            select(WinamPlayer)
            .where((WinamPlayer.msisdn == digits) | (WinamPlayer.msisdn_hash == msisdn_hash))
            .limit(1)
        ).scalar_one_or_none()
    )
    is_new = False
    if not player:
        player = WinamPlayer(msisdn_hash=msisdn_hash, msisdn_last4=last4, msisdn=digits)
        db.add(player)
        db.commit()
        db.refresh(player)
        return player, True

    player.msisdn_hash = msisdn_hash
    player.msisdn = digits
    player.msisdn_last4 = last4
    db.commit()
    db.refresh(player)
    return player, is_new


def _local_mock_verify(db: Session, msisdn: str, code: str) -> dict[str, object]:
    normalized = normalize_msisdn(msisdn)
    msisdn_hash = sha256(normalized)
    last4 = normalized[-4:]

    if code not in {"0000", "000000"}:
        otp = db.execute(
            select(WinamOtpSession)
            .where(WinamOtpSession.msisdn_hash == msisdn_hash)
            .where(WinamOtpSession.code_hash == sha256(code))
            .where(WinamOtpSession.used.is_(False))
            .order_by(WinamOtpSession.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()
        if not otp:
            return {"success": False, "message": "Invalid OTP code"}
        if otp.expires_at < wat_now():
            return {"success": False, "message": "OTP has expired"}
        otp.used = True
        db.commit()

    player, is_new = _upsert_player(db, normalized)
    sub = db.execute(
        select(WinamSubscription)
        .where(WinamSubscription.player_id == player.id)
        .order_by(WinamSubscription.valid_from.desc())
        .limit(1)
    ).scalar_one_or_none()
    if not sub:
        sub = WinamSubscription(
            player_id=player.id,
            plan=SubscriptionPlan.weekly,
            status=SubscriptionStatus.active,
            valid_until=wat_now().replace(hour=22, minute=59, second=59, microsecond=999999),
        )
        db.add(sub)
        db.commit()

    data = {
        "service_id": 42,
        "msisdn": normalize_msisdn_for_intelli(normalized),
        "has_any_subscription": True,
        "has_active_subscription": True,
        "active_subscription": {
            "subscription_id": sub.id,
            "sub_status": sub.status.value,
            "sub_active": sub.status == SubscriptionStatus.active,
            "telco": "MTN",
            "traffic_source": "MOBPLUS",
            "active_product_id": 10,
            "auto_renewal": True,
            "starts_date": sub.valid_from.isoformat() if sub.valid_from else wat_now().isoformat(),
            "ends_date": sub.valid_until.isoformat() if sub.valid_until else wat_now().isoformat(),
        },
    }
    return {
        "success": True,
        "message": "OTP verified successfully",
        "playerId": player.id,
        "isNewPlayer": is_new,
        "needsOnboarding": is_new or not player.nickname,
        "msisdnLast4": last4,
        "msisdn": normalize_msisdn_for_intelli(normalized),
        "hasActiveSubscription": True,
        "activeSubscription": data["active_subscription"],
        "data": data,
    }


def send_otp(db: Session, msisdn: str) -> dict:
    if is_mock_mode():
        return _local_mock_send_otp(db, msisdn)

    normalized = normalize_msisdn_for_intelli(msisdn)
    response = intelli_send_otp(normalized)
    if not response.success:
        return {"success": False, "message": response.message or "Failed to send OTP"}
    return {
        "success": True,
        "message": response.message or f"OTP sent successfully to {normalized}",
        "msisdnLast4": normalized[-4:],
    }


def verify_otp(db: Session, msisdn: str, code: str) -> dict:
    if is_mock_mode():
        return _local_mock_verify(db, msisdn, code)

    normalized = normalize_msisdn_for_intelli(msisdn)
    response = intelli_verify_otp(normalized, code)
    if not response.success or not response.data:
        return {"success": False, "message": response.message or "Invalid OTP code"}

    data = response.data
    active = bool(data.get("has_active_subscription"))
    subscription_data = data.get("active_subscription") if isinstance(data.get("active_subscription"), dict) else None
    player, is_new = _upsert_player(db, normalized)
    player, subscription = sync_subscription_from_intelli(
        db,
        normalized,
        subscription_data,
        has_active=active,
        source="verify",
    )

    if not active:
        latest = subscription
        redirect_url = None
        if isinstance(data.get("client_action"), dict):
            redirect_url = data["client_action"].get("redirection_url")
        return {
            "success": True,
            "message": response.message or "OTP verified successfully",
            "playerId": player.id,
            "isNewPlayer": is_new,
            "needsOnboarding": False,
            "msisdnLast4": normalized[-4:],
            "msisdn": normalized,
            "hasActiveSubscription": False,
            "activeSubscription": None,
            "redirectUrl": redirect_url,
            "data": data,
            "subscriptionId": latest.id if latest else None,
        }

    return {
        "success": True,
        "message": response.message or "OTP verified successfully",
        "playerId": player.id,
        "isNewPlayer": is_new,
        "needsOnboarding": is_new or not player.nickname,
        "msisdnLast4": normalized[-4:],
        "msisdn": normalized,
        "hasActiveSubscription": True,
        "activeSubscription": subscription_data,
        "data": data,
        "subscriptionId": subscription.id if subscription else None,
    }


def set_nickname(db: Session, player_id: str, nickname: str) -> dict:
    existing = db.execute(select(WinamPlayer).where(WinamPlayer.nickname == nickname).where(WinamPlayer.id != player_id)).scalar_one_or_none()
    if existing:
        return {"success": False, "error": "Nickname already taken"}
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        return {"success": False, "error": "Player not found"}
    player.nickname = nickname
    db.commit()
    return {"success": True}


def renew_subscription(db: Session, player_id: str, plan: SubscriptionPlan) -> dict:
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        return {"success": False, "error": "Player not found"}

    current = db.execute(
        select(WinamSubscription)
        .where(WinamSubscription.player_id == player_id)
        .order_by(WinamSubscription.valid_from.desc())
        .limit(1)
    ).scalar_one_or_none()
    if not current:
        return {"success": False, "error": "No subscription found"}

    current.plan = plan
    current.status = SubscriptionStatus.active
    current.valid_until = wat_now().replace(hour=22, minute=59, second=59, microsecond=999999)
    db.commit()
    return {"success": True}


def get_player_subscription_status(db: Session, player_id: str) -> dict[str, object]:
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        return {"success": False, "error": "Player not found"}
    if not player.msisdn:
        latest = db.execute(
            select(WinamSubscription)
            .where(WinamSubscription.player_id == player_id)
            .order_by(WinamSubscription.valid_from.desc())
            .limit(1)
        ).scalar_one_or_none()
        return {
            "success": True,
            "data": {
                "msisdn": None,
                "has_any_subscription": bool(latest),
                "has_active_subscription": bool(latest and latest.status == SubscriptionStatus.active),
                "active_subscription": None,
                "billing_records": [],
                "client_action": None,
            },
        }

    if is_mock_mode():
        latest = db.execute(
            select(WinamSubscription)
            .where(WinamSubscription.player_id == player_id)
            .order_by(WinamSubscription.valid_from.desc())
            .limit(1)
        ).scalar_one_or_none()
        active = bool(latest and latest.status == SubscriptionStatus.active)
        return {
            "success": True,
            "data": {
                "service_id": 42,
                "msisdn": player.msisdn,
                "has_any_subscription": bool(latest),
                "has_active_subscription": active,
                "active_subscription": {
                    "subscription_id": latest.id if latest else None,
                    "sub_status": latest.status.value if latest else None,
                    "sub_active": active,
                    "telco": "MTN",
                    "traffic_source": "MOBPLUS",
                    "active_product_id": 10,
                    "auto_renewal": True,
                    "starts_date": latest.valid_from.isoformat() if latest and latest.valid_from else None,
                    "ends_date": latest.valid_until.isoformat() if latest and latest.valid_until else None,
                } if active else None,
                "billing_records": [],
                "client_action": None if active else {"action": "redirect", "redirection_url": "/subscribe"},
            },
        }

    response = intelli_subscription_status(player.msisdn)
    if response.success and response.data:
        active = bool(response.data.get("has_active_subscription"))
        subscription_data = response.data.get("active_subscription") if isinstance(response.data.get("active_subscription"), dict) else None
        sync_subscription_from_intelli(
            db,
            player.msisdn,
            subscription_data,
            has_active=active,
            source="status",
        )
    return {
        "success": response.success,
        "data": response.data,
        "message": response.message,
    }
