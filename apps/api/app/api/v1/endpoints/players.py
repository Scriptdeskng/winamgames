from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.enums import DrawWeekStatus
from app.domain.models import (
    WinamDrawWeek,
    WinamEntryLedger,
    WinamGameSession,
    WinamPlatformConfig,
    WinamPlayer,
    WinamSubscription,
)
from app.services.draws import get_current_draw_week
from app.services.missions import ensure_active_missions
from app.services.auth import get_player_subscription_status

router = APIRouter()


def _ticket_id_for(ledger_id: str, index: int) -> str:
    compact = ledger_id.replace("-", "").upper()
    base = compact[:6]
    suffix = str(index + 1).zfill(2)
    return f"WG-{base}-{suffix}"


@router.get("/me")
def get_me(player_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        return {"success": False, "error": "Player not found"}
    week = get_current_draw_week(db)
    missions = ensure_active_missions(db, player_id)
    return {
        "success": True,
        "player": {
            "id": player.id,
            "nickname": player.nickname,
            "msisdnLast4": player.msisdn_last4,
            "coinBalance": player.coin_balance,
            "xpTotal": player.xp_total,
            "currentStreak": player.current_streak,
            "rankTier": player.rank_tier.value,
        },
        "drawWeek": (
            {
                "id": week.id,
                "drawExecutesAt": week.draw_executes_at.isoformat(),
                "weekStartWat": week.week_start_wat.isoformat(),
                "weekEndWat": week.week_end_wat.isoformat(),
                "status": week.status.value,
            }
            if week
            else None
        ),
        "missionsCount": len(missions),
    }


@router.get("/subscription")
def get_subscription(player_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
    return get_player_subscription_status(db, player_id)


@router.get("/dashboard")
def get_dashboard(player_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        return {"success": False, "error": "Player not found"}

    week = get_current_draw_week(db)
    missions = ensure_active_missions(db, player_id)
    sessions = list(db.execute(select(WinamGameSession).where(WinamGameSession.player_id == player_id)).scalars())
    total_sessions = len(sessions)
    best_session = max((session.puzzles_solved or 0 for session in sessions), default=0)
    week_total = 0
    if week:
        week_entries = list(
            db.execute(
                select(WinamEntryLedger)
                .where(WinamEntryLedger.player_id == player_id)
                .where(WinamEntryLedger.draw_week_id == week.id)
                .order_by(WinamEntryLedger.created_at.desc())
                .limit(1)
            ).scalars()
        )
        if week_entries:
            week_total = week_entries[0].week_total_after or 0

    published_cfg = db.execute(
        select(WinamPlatformConfig).where(WinamPlatformConfig.key == "winners_published_week_id")
    ).scalar_one_or_none()
    raw_published_week_id = published_cfg.value if published_cfg else None
    published_week_id = raw_published_week_id if isinstance(raw_published_week_id, str) and len(raw_published_week_id) > 10 else None

    return {
        "success": True,
        "player": {
            "id": player.id,
            "nickname": player.nickname,
            "msisdnLast4": player.msisdn_last4,
            "coinBalance": player.coin_balance,
            "xpTotal": player.xp_total,
            "rankTier": player.rank_tier.value,
            "currentStreak": player.current_streak,
            "avatarId": player.avatar_id,
        },
        "weekTotal": week_total,
        "weekCap": 50,
        "totalSessions": total_sessions,
        "bestSession": best_session,
        "drawWeek": (
            {
                "id": week.id,
                "drawExecutesAt": week.draw_executes_at.isoformat(),
                "weekStartWat": week.week_start_wat.isoformat(),
                "weekEndWat": week.week_end_wat.isoformat(),
                "status": week.status.value,
            }
            if week
            else None
        ),
        "publishedWeekId": published_week_id,
        "missionsCount": len(missions),
    }


@router.get("/entries")
def get_entries(player_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        return {"success": False, "error": "Player not found"}

    ledger_rows = list(
        db.execute(
            select(WinamEntryLedger)
            .where(WinamEntryLedger.player_id == player_id)
            .order_by(WinamEntryLedger.created_at.desc())
        ).scalars()
    )
    week_ids = list({row.draw_week_id for row in ledger_rows if row.draw_week_id})

    open_week = db.execute(
        select(WinamDrawWeek).where(WinamDrawWeek.status == DrawWeekStatus.open).limit(1)
    ).scalar_one_or_none()
    if open_week and open_week.id not in week_ids:
        week_ids.insert(0, open_week.id)

    week_rows = []
    if week_ids:
        week_rows = list(
            db.execute(
                select(WinamDrawWeek)
                .where(WinamDrawWeek.id.in_(week_ids))
            ).scalars()
        )
    week_map = {week.id: week for week in week_rows}

    grouped: dict[str, list[dict[str, object]]] = {}
    for row in ledger_rows:
        if not row.draw_week_id:
            continue
        tickets = grouped.get(row.draw_week_id, [])
        count = max(0, row.entries_delta or 0)
        for i in range(count):
            tickets.append(
                {
                    "ticketId": _ticket_id_for(row.id, i),
                    "source": row.source_type.value,
                    "earnedAt": row.created_at.isoformat() if row.created_at else None,
                }
            )
        grouped[row.draw_week_id] = tickets

    weeks = []
    for week_id in week_ids:
        week = week_map.get(week_id)
        if not week:
            continue
        tickets = grouped.get(week_id, [])
        weeks.append(
            {
                "drawWeekId": week.id,
                "weekStartWat": week.week_start_wat.isoformat(),
                "weekEndWat": week.week_end_wat.isoformat(),
                "drawExecutesAt": week.draw_executes_at.isoformat(),
                "status": week.status.value,
                "totalTickets": len(tickets),
                "tickets": tickets,
            }
        )

    weeks.sort(key=lambda w: w["weekStartWat"], reverse=True)
    weeks.sort(key=lambda w: 0 if w["status"] == "open" else 1)

    return {"success": True, "weeks": weeks, "weekCap": 50}
