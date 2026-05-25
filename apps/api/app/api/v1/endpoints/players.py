from fastapi import APIRouter, Depends, Request
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
from app.services.kyc import get_kyc_status as get_kyc_status_service
from app.services.session_tokens import PLAYER_SESSION_COOKIE, require_session_subject

router = APIRouter()


def _require_player(request: Request, player_id: str) -> None:
    require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
        provided_subject=player_id,
    )


def _ticket_id_for(ledger_id: str, index: int) -> str:
    compact = ledger_id.replace("-", "").upper()
    base = compact[:6]
    suffix = str(index + 1).zfill(2)
    return f"WG-{base}-{suffix}"


@router.get("/me")
def get_me(player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _require_player(request, player_id)
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
def get_subscription(player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _require_player(request, player_id)
    return get_player_subscription_status(db, player_id)


@router.get("/profile")
def get_profile(player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _require_player(request, player_id)
    dashboard = get_dashboard(player_id, request, db)
    subscription = get_player_subscription_status(db, player_id)
    kyc_result = get_kyc_status_service(db, player_id)
    kyc = kyc_result.get("kyc")
    return {
        "success": True,
        "player": dashboard.get("player"),
        "dashboard": dashboard,
        "subscription": subscription,
        "kyc": (
            {
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
            if kyc
            else None
        ),
    }


@router.get("/dashboard")
def get_dashboard(player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _require_player(request, player_id)
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


@router.get("/recent-sessions")
def get_recent_sessions(player_id: str, request: Request, limit: int = 10, db: Session = Depends(get_db)) -> dict[str, object]:
    _require_player(request, player_id)
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        return {"success": False, "error": "Player not found"}

    limit = min(max(1, limit), 50)
    sessions = list(
        db.execute(
            select(WinamGameSession)
            .where(WinamGameSession.player_id == player_id)
            .order_by(WinamGameSession.completed_at.desc().nullslast())
            .limit(limit)
        ).scalars()
    )
    return {
        "success": True,
        "sessions": [
            {
                "id": session.id,
                "game_type": session.game_type.value,
                "puzzles_solved": session.puzzles_solved,
                "entries_awarded": session.entries_awarded,
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "hints_used": session.hints_used,
                "coins_earned": session.coins_awarded,
                "xp_earned": session.puzzles_solved * 10,
                "duration_seconds": session.duration_seconds,
            }
            for session in sessions
        ],
    }


@router.get("/entries")
def get_entries(player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _require_player(request, player_id)
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
