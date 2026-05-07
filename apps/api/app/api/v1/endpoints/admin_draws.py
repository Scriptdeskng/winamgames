from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.enums import DrawWeekStatus
from app.domain.models import WinamDrawWeek, WinamEntryLedger, WinamPlayer, WinamPlatformConfig, WinamWinner
from app.services.draw_engine import AirtimeTier, CashTier, LedgerRow, expand_tickets, select_winners
from app.services.admin_auth import verify_admin_session
from app.services.draws import wat_now

router = APIRouter()


class AdminDrawPayload(BaseModel):
    admin_id: str
    draw_week_id: str


def _assert_admin(db: Session, admin_id: str) -> None:
    if not verify_admin_session(db, admin_id).get("valid"):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _get_week(db: Session, draw_week_id: str) -> WinamDrawWeek:
    week = db.execute(select(WinamDrawWeek).where(WinamDrawWeek.id == draw_week_id)).scalar_one_or_none()
    if not week:
        raise HTTPException(status_code=404, detail="Draw week not found")
    return week


@router.post("/lock")
def lock_draw(payload: AdminDrawPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(db, payload.admin_id)
    week = _get_week(db, payload.draw_week_id)
    if week.status != DrawWeekStatus.open:
        raise HTTPException(status_code=400, detail=f"Cannot lock draw — status is {week.status.value}")
    total_entries = (
        db.execute(
            select(WinamEntryLedger.entries_delta).where(WinamEntryLedger.draw_week_id == payload.draw_week_id)
        ).scalars().all()
    )
    week.total_entries = sum(int(v or 0) for v in total_entries)
    week.status = DrawWeekStatus.locked
    db.commit()
    return {"success": True, "totalEntries": week.total_entries}


@router.post("/execute")
def execute_draw(payload: AdminDrawPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(db, payload.admin_id)
    week = _get_week(db, payload.draw_week_id)
    if week.status != DrawWeekStatus.locked:
        raise HTTPException(status_code=400, detail=f"Cannot execute — status is {week.status.value}")

    ledger_rows = [
        LedgerRow(id=row.id, player_id=row.player_id, entries_delta=row.entries_delta)
        for row in db.execute(
            select(WinamEntryLedger.id, WinamEntryLedger.player_id, WinamEntryLedger.entries_delta).where(
                WinamEntryLedger.draw_week_id == payload.draw_week_id
            )
        ).all()
    ]
    flagged_ids = {
        row[0]
        for row in db.execute(select(WinamPlayer.id).where(WinamPlayer.is_flagged.is_(True))).all()
    }
    weekly_cap = 50
    cash_tiers = [CashTier(position=1, amount_naira=35000), CashTier(position=2, amount_naira=10000), CashTier(position=3, amount_naira=5000)]
    airtime_tiers = [AirtimeTier(count=75, amount_naira=200)]
    seed = wat_now().strftime("%Y%m%d%H%M%S%f")
    tickets = expand_tickets(ledger_rows, weekly_cap, flagged_ids)
    winners = select_winners(tickets, seed, cash_tiers, airtime_tiers)
    if not winners:
        raise HTTPException(status_code=400, detail="No eligible tickets to draw winners from")

    db.query(WinamWinner).filter(WinamWinner.draw_week_id == payload.draw_week_id).delete()
    for winner in winners:
        db.add(
            WinamWinner(
                draw_week_id=payload.draw_week_id,
                player_id=winner.player_id,
                position=winner.position,
                prize_type=winner.prize_type,
                prize_amount=winner.prize_amount,
                ticket_id=winner.ticket_id,
                is_flagged=False,
            )
        )
    week.draw_seed = seed
    week.status = DrawWeekStatus.drawn
    db.commit()
    return {"success": True, "winnerCount": len(winners), "totalTickets": len(tickets)}


@router.post("/publish")
def publish_draw(payload: AdminDrawPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(db, payload.admin_id)
    week = _get_week(db, payload.draw_week_id)
    if week.status != DrawWeekStatus.drawn:
        raise HTTPException(status_code=400, detail=f"Cannot publish — status is {week.status.value}")
    db.merge(
        WinamPlatformConfig(
            key="winners_published_week_id",
            value=payload.draw_week_id,
            updated_by=payload.admin_id,
        )
    )
    db.commit()
    return {"success": True}


@router.post("/settle")
def settle_draw(payload: AdminDrawPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(db, payload.admin_id)
    week = _get_week(db, payload.draw_week_id)
    if week.status != DrawWeekStatus.drawn:
        raise HTTPException(status_code=400, detail=f"Cannot settle — status is {week.status.value}")
    week.status = DrawWeekStatus.settled
    db.commit()
    return {"success": True}
