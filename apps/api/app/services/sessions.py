from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.enums import EntrySourceType, GameType
from app.domain.models import WinamEntryLedger, WinamGameSession, WinamPlayer
from app.schemas.common import SessionCloseRequest
from app.services.draws import get_or_create_current_draw_week, wat_date, wat_now


def start_game_session(db: Session, player_id: str, game_type: GameType) -> dict:
    week = get_or_create_current_draw_week(db)
    session = WinamGameSession(
        player_id=player_id,
        draw_week_id=week.id,
        game_type=game_type,
        session_date_wat=wat_date(),
        completed_at=None,
        duration_seconds=0,
        puzzles_solved=0,
        hints_used=0,
        entries_awarded=0,
        coins_awarded=0,
        is_free_session=False,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "draw_week_id": session.draw_week_id,
        "game_type": session.game_type.value,
    }


def close_game_session(db: Session, payload: SessionCloseRequest) -> dict:
    game_type = payload.game_type
    stmt = select(WinamGameSession).where(
        WinamGameSession.id == payload.session_id,
        WinamGameSession.player_id == payload.player_id,
    )
    session = db.execute(stmt).scalar_one_or_none()
    if session is None:
        raise ValueError("Game session not found")

    if session.completed_at is not None:
        return {
            "session_id": session.id,
            "draw_week_id": session.draw_week_id,
            "entries_awarded": session.entries_awarded,
            "coins_awarded": session.coins_awarded,
            "mission_completions": [],
        }

    puzzles_solved = max(0, payload.puzzles_solved)
    hints_used = max(0, payload.hints_used)
    duration_seconds = max(0, payload.duration_seconds)
    entries_awarded = min(5, puzzles_solved)
    coins_awarded = max(0, puzzles_solved * 10 - hints_used * 2)

    session.game_type = game_type
    session.completed_at = wat_now()
    session.duration_seconds = duration_seconds
    session.puzzles_solved = puzzles_solved
    session.hints_used = hints_used
    session.entries_awarded = entries_awarded
    session.coins_awarded = coins_awarded
    session.session_date_wat = wat_date()

    player = db.execute(
        select(WinamPlayer).where(WinamPlayer.id == payload.player_id)
    ).scalar_one()
    player.coin_balance = (player.coin_balance or 0) + coins_awarded
    player.xp_total = (player.xp_total or 0) + (puzzles_solved * 25)
    player.last_session_date = wat_date()

    if entries_awarded > 0:
        week = get_or_create_current_draw_week(db)
        week_total_after = entries_awarded
        last_total = (
            db.query(WinamEntryLedger.week_total_after)
            .filter(WinamEntryLedger.player_id == payload.player_id)
            .filter(WinamEntryLedger.draw_week_id == week.id)
            .order_by(WinamEntryLedger.created_at.desc())
            .limit(1)
            .scalar()
        )
        if last_total is not None:
            week_total_after = int(last_total) + entries_awarded
        ledger = WinamEntryLedger(
            player_id=payload.player_id,
            draw_week_id=week.id,
            source_type=EntrySourceType.game_session,
            source_id=session.id,
            entries_delta=entries_awarded,
            cap_overflow=0,
            week_total_after=week_total_after,
        )
        db.add(ledger)

    db.commit()
    return {
        "session_id": session.id,
        "draw_week_id": session.draw_week_id,
        "entries_awarded": entries_awarded,
        "coins_awarded": coins_awarded,
        "mission_completions": [],
    }
