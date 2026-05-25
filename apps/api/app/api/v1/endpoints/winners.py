from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.enums import DrawWeekStatus
from app.domain.models import WinamDrawWeek, WinamKyc, WinamPayment, WinamPlayer, WinamWinner
from app.services.session_tokens import PLAYER_SESSION_COOKIE, require_session_subject

router = APIRouter()


@router.get("/published")
def published_winners(db: Session = Depends(get_db)) -> dict[str, object]:
    weeks = list(
        db.execute(
            select(WinamDrawWeek)
            .where(WinamDrawWeek.status == DrawWeekStatus.settled)
            .order_by(WinamDrawWeek.week_start_wat.desc())
        ).scalars()
    )
    if not weeks:
        return {"weeks": []}

    week_ids = [week.id for week in weeks]
    winners = list(
        db.execute(
            select(WinamWinner)
            .where(WinamWinner.draw_week_id.in_(week_ids))
            .where(WinamWinner.is_flagged.is_(False))
            .order_by(WinamWinner.position.asc())
        ).scalars()
    )
    player_ids = list({winner.player_id for winner in winners if winner.player_id})
    player_map = {
        player.id: player
        for player in db.execute(select(WinamPlayer).where(WinamPlayer.id.in_(player_ids))).scalars()
    }

    winners_by_week: dict[str, list[dict[str, object]]] = {}
    for winner in winners:
        if not winner.draw_week_id:
            continue
        player = player_map.get(winner.player_id) if winner.player_id else None
        winners_by_week.setdefault(winner.draw_week_id, []).append(
            {
                "id": winner.id,
                "position": winner.position,
                "prizeType": winner.prize_type,
                "prizeAmount": winner.prize_amount,
                "ticketId": winner.ticket_id,
                "nickname": player.nickname if player else None,
                "msisdnLast4": player.msisdn_last4 if player else "----",
            }
        )

    return {
        "weeks": [
            {
                "week": {
                    "id": week.id,
                    "week_start_wat": week.week_start_wat.isoformat(),
                    "week_end_wat": week.week_end_wat.isoformat(),
                    "status": week.status.value,
                },
                "winners": winners_by_week.get(week.id, []),
            }
            for week in weeks
            if winners_by_week.get(week.id)
        ]
    }


@router.get("/me")
def my_winner_status(player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
        provided_subject=player_id,
    )
    winner = db.execute(
        select(WinamWinner)
        .join(WinamDrawWeek, WinamWinner.draw_week_id == WinamDrawWeek.id)
        .where(WinamWinner.player_id == player_id)
        .where(WinamWinner.is_flagged.is_(False))
        .where(WinamDrawWeek.status == DrawWeekStatus.settled)
        .order_by(WinamWinner.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if not winner:
        return {"won": False}

    kyc = db.execute(select(WinamKyc).where(WinamKyc.player_id == player_id)).scalar_one_or_none()
    payment = db.execute(select(WinamPayment).where(WinamPayment.winner_id == winner.id)).scalar_one_or_none()

    return {
        "won": True,
        "winnerId": winner.id,
        "drawWeekId": winner.draw_week_id,
        "position": winner.position,
        "prizeType": winner.prize_type,
        "prizeAmount": winner.prize_amount,
        "kyc": (
            {
                "identitySubmitted": bool(kyc and kyc.submitted_at),
                "bankSubmitted": bool(kyc and kyc.bank_details_submitted_at),
                "verified": bool(kyc and kyc.verified),
                "paymentProcessed": bool(payment and payment.status == "paid"),
            }
            if kyc
            else None
        ),
    }
