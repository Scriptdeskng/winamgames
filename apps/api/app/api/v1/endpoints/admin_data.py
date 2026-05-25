from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.enums import SubscriptionStatus
from app.domain.models import (
    WinamBanner,
    WinamDrawWeek,
    WinamEntryLedger,
    WinamGameSession,
    WinamIntelliEvent,
    WinamKyc,
    WinamMission,
    WinamPayment,
    WinamPlayer,
    WinamPlayerMission,
    WinamPlatformConfig,
    WinamSubscription,
    WinamWinner,
)
from app.services.draws import get_current_draw_week, wat_date
from app.services.admin_auth import verify_admin_session
from app.services.session_tokens import ADMIN_SESSION_COOKIE, require_session_subject

router = APIRouter()


def _assert_admin(request: Request, db: Session, admin_id: str) -> None:
    require_session_subject(
        request,
        cookie_name=ADMIN_SESSION_COOKIE,
        expected_kind="admin",
        provided_subject=admin_id,
    )
    result = verify_admin_session(db, admin_id)
    if not result.get("valid"):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _serialize_kyc(kyc: WinamKyc | None) -> dict[str, object] | None:
    if not kyc:
        return None
    return {
        "id": kyc.id,
        "player_id": kyc.player_id,
        "first_name": kyc.first_name,
        "last_name": kyc.last_name,
        "dob": kyc.dob,
        "id_type": kyc.id_type,
        "id_number": kyc.id_number,
        "bank_name": kyc.bank_name,
        "bank_code": kyc.bank_code,
        "account_name": kyc.account_name,
        "account_number": kyc.account_number,
        "submitted_at": kyc.submitted_at.isoformat() if kyc.submitted_at else None,
        "bank_details_submitted_at": kyc.bank_details_submitted_at.isoformat() if kyc.bank_details_submitted_at else None,
        "verified": kyc.verified,
        "verified_at": kyc.verified_at.isoformat() if kyc.verified_at else None,
        "verified_by": kyc.verified_by,
    }


def _serialize_payment(payment: WinamPayment) -> dict[str, object]:
    return {
        "id": payment.id,
        "player_id": payment.player_id,
        "winner_id": payment.winner_id,
        "draw_week_id": payment.draw_week_id,
        "amount_naira": payment.amount_naira,
        "prize_type": payment.prize_type,
        "status": payment.status,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        "paid_by": payment.paid_by,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
    }


def _serialize_intelli_event(event: WinamIntelliEvent) -> dict[str, object]:
    return {
        "id": event.id,
        "event_type": event.event_type,
        "telco": event.telco,
        "action": event.action,
        "msisdn": event.msisdn,
        "product_id": event.product_id,
        "product_name": event.product_name,
        "status": event.status,
        "previous_status": event.previous_status,
        "new_status": event.new_status,
        "changed_existing": event.changed_existing,
        "auto_renewal": event.auto_renewal,
        "telco_ref": event.telco_ref,
        "player_id": event.player_id,
        "subscription_id": event.subscription_id,
        "payload": event.payload,
        "created_at": event.created_at.isoformat() if event.created_at else None,
    }


@router.get("/dashboard/stats")
def dashboard_stats(admin_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    today = wat_date()
    current_week = get_current_draw_week(db)

    total_players = db.execute(select(WinamPlayer)).scalars().all()
    active_subs = db.execute(
        select(WinamSubscription).where(WinamSubscription.status == SubscriptionStatus.active)
    ).scalars().all()
    sessions_today = db.execute(
        select(WinamGameSession).where(WinamGameSession.session_date_wat == today)
    ).scalars().all()

    week_entries = 0
    week_payload = None
    if current_week:
        week_payload = {
            "id": current_week.id,
            "status": current_week.status.value,
            "week_start_wat": current_week.week_start_wat.isoformat(),
            "week_end_wat": current_week.week_end_wat.isoformat(),
            "entry_lock_at": current_week.entry_lock_at.isoformat(),
            "draw_executes_at": current_week.draw_executes_at.isoformat(),
            "total_entries": current_week.total_entries,
        }
        ledger_rows = db.execute(
            select(WinamEntryLedger.entries_delta).where(WinamEntryLedger.draw_week_id == current_week.id)
        ).all()
        week_entries = sum(int(row[0] or 0) for row in ledger_rows)

    recent_sessions = list(
        db.execute(
            select(WinamGameSession)
            .order_by(WinamGameSession.completed_at.desc())
            .limit(10)
        ).scalars()
    )
    player_ids = {session.player_id for session in recent_sessions}
    players = {
        player.id: player
        for player in db.execute(select(WinamPlayer).where(WinamPlayer.id.in_(list(player_ids)))).scalars()
    }
    recent_intelli_events = list(
        db.execute(
            select(WinamIntelliEvent)
            .order_by(WinamIntelliEvent.created_at.desc())
            .limit(5)
        ).scalars()
    )
    intelli_event_rows = db.execute(select(WinamIntelliEvent.event_type)).all()
    intelli_counts: dict[str, int] = {}
    for row in intelli_event_rows:
        event_type = str(row[0] or "")
        if event_type:
            intelli_counts[event_type] = intelli_counts.get(event_type, 0) + 1

    return {
        "totalPlayers": len(total_players),
        "activeSubscriptions": len(active_subs),
        "sessionsToday": len(sessions_today),
        "currentWeekEntries": week_entries,
        "currentWeek": week_payload,
        "intelliEventsTotal": len(intelli_event_rows),
        "intelliEventCounts": intelli_counts,
        "recentIntelliEvents": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "telco": event.telco,
                "msisdn": event.msisdn,
                "product_name": event.product_name,
                "status": event.status,
                "previous_status": event.previous_status,
                "new_status": event.new_status,
                "changed_existing": event.changed_existing,
                "created_at": event.created_at.isoformat() if event.created_at else None,
            }
            for event in recent_intelli_events
        ],
        "recentSessions": [
            {
                "id": session.id,
                "game_type": session.game_type.value,
                "puzzles_solved": session.puzzles_solved,
                "entries_awarded": session.entries_awarded,
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "player_id": session.player_id,
                "player": {
                    "nickname": players.get(session.player_id).nickname if players.get(session.player_id) else None,
                    "msisdn_last4": players.get(session.player_id).msisdn_last4 if players.get(session.player_id) else "----",
                },
            }
            for session in recent_sessions
        ],
    }


@router.get("/players")
def list_players(
    admin_id: str,
    request: Request,
    search: str | None = None,
    page: int = 1,
    limit: int = 25,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    page = max(1, page)
    limit = min(max(1, limit), 100)
    query = select(WinamPlayer).order_by(WinamPlayer.created_at.desc())
    if search:
        s = f"%{search.strip()}%"
        query = query.where((WinamPlayer.nickname.ilike(s)) | (WinamPlayer.msisdn_last4.ilike(s)))
    players = list(db.execute(query.offset((page - 1) * limit).limit(limit)).scalars())
    current_week = get_current_draw_week(db)
    ticket_totals = {}
    if current_week and players:
        player_ids = [player.id for player in players]
        ledger_rows = db.execute(
            select(WinamEntryLedger.player_id, WinamEntryLedger.entries_delta)
            .where(WinamEntryLedger.draw_week_id == current_week.id)
            .where(WinamEntryLedger.player_id.in_(player_ids))
        ).all()
        for player_id, entries_delta in ledger_rows:
            ticket_totals[player_id] = ticket_totals.get(player_id, 0) + (entries_delta or 0)

    return {
        "players": [
            {
                "id": player.id,
                "nickname": player.nickname,
                "msisdn_last4": player.msisdn_last4,
                "rank_tier": player.rank_tier.value,
                "coin_balance": player.coin_balance,
                "xp_total": player.xp_total,
                "current_streak": player.current_streak,
                "is_flagged": player.is_flagged,
                "created_at": player.created_at.isoformat() if player.created_at else None,
                "last_session_date": player.last_session_date.isoformat() if player.last_session_date else None,
                "week_tickets": ticket_totals.get(player.id, 0),
            }
            for player in players
        ],
        "total": len(db.execute(select(WinamPlayer)).scalars().all()),
    }


@router.get("/players/{player_id}")
def player_detail(admin_id: str, player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return {
        "player": {
            "id": player.id,
            "nickname": player.nickname,
            "msisdn_last4": player.msisdn_last4,
            "coin_balance": player.coin_balance,
            "xp_total": player.xp_total,
            "current_streak": player.current_streak,
            "rank_tier": player.rank_tier.value,
            "is_flagged": player.is_flagged,
            "flag_reason": player.flag_reason,
        },
        "subscriptions": [
            {
                "id": sub.id,
                "status": sub.status.value,
                "plan": sub.plan.value,
                "valid_from": sub.valid_from.isoformat() if sub.valid_from else None,
                "valid_until": sub.valid_until.isoformat() if sub.valid_until else None,
            }
            for sub in db.execute(
                select(WinamSubscription).where(WinamSubscription.player_id == player_id)
            ).scalars()
        ],
        "sessions": [
            {
                "id": session.id,
                "game_type": session.game_type.value,
                "puzzles_solved": session.puzzles_solved,
                "entries_awarded": session.entries_awarded,
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            }
            for session in db.execute(
                select(WinamGameSession)
                .where(WinamGameSession.player_id == player_id)
                .order_by(WinamGameSession.completed_at.desc())
                .limit(20)
            ).scalars()
        ],
        "ledger": [
            {
                "draw_week_id": row.draw_week_id,
                "entries_delta": row.entries_delta,
                "source_type": row.source_type.value,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in db.execute(
                select(WinamEntryLedger)
                .where(WinamEntryLedger.player_id == player_id)
                .order_by(WinamEntryLedger.created_at.desc())
            ).scalars()
        ],
        "missions": [
            {
                "id": row.id,
                "mission_id": row.mission_id,
                "status": row.status.value,
                "progress_current": row.progress_current,
                "entries_awarded": row.entries_awarded,
                "assigned_date_wat": row.assigned_date_wat.isoformat() if row.assigned_date_wat else None,
                "completed_at": row.completed_at.isoformat() if row.completed_at else None,
            }
            for row in db.execute(
                select(WinamPlayerMission)
                .where(WinamPlayerMission.player_id == player_id)
                .order_by(WinamPlayerMission.completed_at.desc().nullslast())
                .limit(20)
            ).scalars()
        ],
        "kyc": _serialize_kyc(
            db.execute(select(WinamKyc).where(WinamKyc.player_id == player_id)).scalar_one_or_none()
        ),
    }


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
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]
    }


@router.get("/intelli/events")
def intelli_events(
    admin_id: str,
    request: Request,
    event_type: str | None = None,
    page: int = 1,
    limit: int = 25,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    page = max(1, page)
    limit = min(max(1, limit), 100)
    query = select(WinamIntelliEvent).order_by(WinamIntelliEvent.created_at.desc())
    total_query = select(WinamIntelliEvent)
    if event_type:
        query = query.where(WinamIntelliEvent.event_type == event_type)
        total_query = total_query.where(WinamIntelliEvent.event_type == event_type)
    rows = list(db.execute(query.offset((page - 1) * limit).limit(limit)).scalars())
    total = len(db.execute(total_query).scalars().all())
    return {
        "events": [_serialize_intelli_event(row) for row in rows],
        "total": total,
    }


@router.get("/missions")
def missions(admin_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    rows = list(db.execute(select(WinamMission).order_by(WinamMission.title.asc())).scalars())
    return {
        "missions": [
            {
                "id": row.id,
                "title": row.title,
                "condition_type": row.condition_type.value,
                "condition_value": row.condition_value,
                "reward_type": row.reward_type.value,
                "reward_amount": row.reward_amount,
                "game_type": row.game_type.value if row.game_type else None,
                "is_active": row.is_active,
            }
            for row in rows
        ]
    }


@router.get("/config")
def platform_config(admin_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    rows = list(db.execute(select(WinamPlatformConfig).order_by(WinamPlatformConfig.key.asc())).scalars())
    return {
        "config": [
            {
                "key": row.key,
                "value": row.value,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                "updated_by": row.updated_by,
            }
            for row in rows
        ]
    }


@router.get("/players/{player_id}/kyc")
def player_kyc(admin_id: str, player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    kyc = db.execute(select(WinamKyc).where(WinamKyc.player_id == player_id)).scalar_one_or_none()
    return {"kyc": _serialize_kyc(kyc)}


@router.get("/players/{player_id}/payments")
def player_payments(admin_id: str, player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    rows = list(
        db.execute(
            select(WinamPayment)
            .where(WinamPayment.player_id == player_id)
            .order_by(WinamPayment.created_at.desc())
        ).scalars()
    )
    return {"payments": [_serialize_payment(row) for row in rows]}


@router.get("/draws")
def draws(admin_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    rows = list(db.execute(select(WinamDrawWeek).order_by(WinamDrawWeek.week_start_wat.desc())).scalars())
    weeks: list[dict[str, object]] = []
    for week in rows:
        ledger_rows = list(
            db.execute(
                select(WinamEntryLedger.player_id, WinamEntryLedger.entries_delta).where(
                    WinamEntryLedger.draw_week_id == week.id
                )
            ).all()
        )
        unique_players = len({player_id for player_id, _ in ledger_rows})
        total_tickets = sum(int(entries_delta or 0) for _, entries_delta in ledger_rows)
        weeks.append(
            {
                "id": week.id,
                "week_start_wat": week.week_start_wat.isoformat(),
                "week_end_wat": week.week_end_wat.isoformat(),
                "entry_lock_at": week.entry_lock_at.isoformat(),
                "draw_executes_at": week.draw_executes_at.isoformat(),
                "status": week.status.value,
                "total_entries": week.total_entries,
                "draw_seed": week.draw_seed,
                "unique_players": unique_players,
                "total_tickets": total_tickets,
            }
        )
    return {"weeks": weeks}


@router.get("/draws/{draw_week_id}/winners")
def draw_winners(admin_id: str, draw_week_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    rows = list(
        db.execute(
            select(WinamWinner)
            .where(WinamWinner.draw_week_id == draw_week_id)
            .order_by(WinamWinner.position.asc())
        ).scalars()
    )
    player_ids = [row.player_id for row in rows if row.player_id]
    player_map = {}
    kyc_map = {}
    payment_map = {}
    if player_ids:
        player_map = {
            player.id: player
            for player in db.execute(select(WinamPlayer).where(WinamPlayer.id.in_(player_ids))).scalars()
        }
        kyc_map = {
            row.player_id: row
            for row in db.execute(select(WinamKyc).where(WinamKyc.player_id.in_(player_ids))).scalars()
        }
    winner_ids = [row.id for row in rows]
    if winner_ids:
        payment_map = {
            row.winner_id: row
            for row in db.execute(select(WinamPayment).where(WinamPayment.winner_id.in_(winner_ids))).scalars()
        }
    return {
        "winners": [
            {
                "id": row.id,
                "draw_week_id": row.draw_week_id,
                "player_id": row.player_id,
                "position": row.position,
                "prize_type": row.prize_type,
                "prize_amount": row.prize_amount,
                "ticket_id": row.ticket_id,
                "is_flagged": row.is_flagged,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "player": (
                    {
                        "nickname": player_map[row.player_id].nickname if row.player_id in player_map else None,
                        "msisdn_last4": player_map[row.player_id].msisdn_last4 if row.player_id in player_map else "----",
                    }
                    if row.player_id
                    else None
                ),
                "kyc": _serialize_kyc(kyc_map.get(row.player_id)) if row.player_id else None,
                "payment": _serialize_payment(payment_map[row.id]) if row.id in payment_map else None,
            }
            for row in rows
        ]
    }
