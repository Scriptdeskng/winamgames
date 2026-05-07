from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.models import WinamKyc, WinamPayment, WinamWinner


def _require_winner(db: Session, player_id: str) -> WinamWinner:
    winner = db.execute(
        select(WinamWinner)
        .where(WinamWinner.player_id == player_id)
        .where(WinamWinner.is_flagged.is_(False))
        .order_by(WinamWinner.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if not winner:
        raise ValueError("KYC submission is only available to draw winners.")
    return winner


def get_kyc_status(db: Session, player_id: str) -> dict:
    kyc = db.execute(select(WinamKyc).where(WinamKyc.player_id == player_id)).scalar_one_or_none()
    return {"kyc": kyc}


def submit_identity(
    db: Session,
    player_id: str,
    first_name: str,
    last_name: str,
    dob: str,
    id_type: str,
    id_number: str,
) -> dict:
    _require_winner(db, player_id)
    kyc = db.execute(select(WinamKyc).where(WinamKyc.player_id == player_id)).scalar_one_or_none()
    if not kyc:
        kyc = WinamKyc(
            player_id=player_id,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            dob=dob,
            id_type=id_type,
            id_number=id_number,
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(kyc)
    else:
        kyc.first_name = first_name.strip()
        kyc.last_name = last_name.strip()
        kyc.dob = dob
        kyc.id_type = id_type
        kyc.id_number = id_number
        kyc.submitted_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}


def submit_bank_details(
    db: Session,
    player_id: str,
    bank_code: str,
    bank_name: str,
    account_number: str,
    account_name: str | None = None,
) -> dict:
    _require_winner(db, player_id)
    kyc = db.execute(select(WinamKyc).where(WinamKyc.player_id == player_id)).scalar_one_or_none()
    if not kyc:
        raise ValueError("Complete identity verification first.")
    kyc.bank_code = bank_code.strip()
    kyc.bank_name = bank_name.strip()
    kyc.account_number = account_number
    kyc.account_name = account_name.strip() if account_name else None
    kyc.bank_details_submitted_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}


def verify_kyc(db: Session, player_id: str, admin_id: str) -> dict:
    kyc = db.execute(select(WinamKyc).where(WinamKyc.player_id == player_id)).scalar_one_or_none()
    if not kyc:
        raise ValueError("KYC record not found")
    kyc.verified = True
    kyc.verified_at = datetime.now(timezone.utc)
    kyc.verified_by = admin_id
    db.commit()
    return {"success": True}


def create_payment_record(
    db: Session,
    admin_id: str,
    player_id: str,
    winner_id: str,
    draw_week_id: str,
    amount_naira: int,
    prize_type: str,
) -> dict:
    payment = WinamPayment(
        player_id=player_id,
        winner_id=winner_id,
        draw_week_id=draw_week_id,
        amount_naira=amount_naira,
        prize_type=prize_type,
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"success": True, "paymentId": payment.id}


def mark_payment_paid(db: Session, payment_id: str, admin_id: str) -> dict:
    payment = db.execute(select(WinamPayment).where(WinamPayment.id == payment_id)).scalar_one_or_none()
    if not payment:
        raise ValueError("Payment not found")
    payment.status = "paid"
    payment.paid_at = datetime.now(timezone.utc)
    payment.paid_by = admin_id
    db.commit()
    return {"success": True}


def get_payments_for_player(db: Session, player_id: str) -> list[WinamPayment]:
    return list(
        db.execute(select(WinamPayment).where(WinamPayment.player_id == player_id).order_by(WinamPayment.created_at.desc())).scalars()
    )

