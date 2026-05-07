from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.models import WinamGameSession, WinamPlayer
from app.services.draws import get_current_draw_week, wat_date

router = APIRouter()


def _build_rows(db: Session, rows: list[tuple[str, int]], limit: int, player_id: str | None) -> dict[str, object]:
    totals: dict[str, int] = {}
    for player_id_row, puzzles in rows:
        if puzzles <= 0:
            continue
        totals[player_id_row] = totals.get(player_id_row, 0) + puzzles

    ranked = sorted(totals.items(), key=lambda item: item[1], reverse=True)
    top = ranked[:limit]
    top_ids = [player_id_row for player_id_row, _ in top]
    players = {
        player.id: player
        for player in db.execute(
            select(WinamPlayer)
            .where(WinamPlayer.id.in_(top_ids))
        ).scalars()
    }

    payload_players = []
    for player_id_row, puzzles in top:
        player = players.get(player_id_row)
        payload_players.append(
            {
                "id": player_id_row,
                "name": player.nickname if player and player.nickname else f"****{player.msisdn_last4 if player else '0000'}",
                "puzzles": puzzles,
                "rankTier": player.rank_tier.value if player else "starter",
            }
        )

    current_player = None
    if player_id and player_id not in top_ids:
        idx = next((index for index, item in enumerate(ranked) if item[0] == player_id), -1)
        if idx >= 0:
            player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
            if player:
                current_player = {
                    "id": player_id,
                    "name": player.nickname if player.nickname else f"****{player.msisdn_last4}",
                    "puzzles": ranked[idx][1],
                    "rankTier": player.rank_tier.value,
                    "rank": idx + 1,
                }

    return {
        "players": payload_players,
        "totalPlayers": len(totals),
        "currentPlayer": current_player,
    }


@router.get("/weekly")
def weekly_leaderboard(limit: int = 10, player_id: str | None = None, db: Session = Depends(get_db)) -> dict[str, object]:
    week = get_current_draw_week(db)
    if not week:
        return {
            "success": True,
            "players": [],
            "totalPlayers": 0,
            "weekStartWat": None,
            "weekEndWat": None,
            "drawExecutesAt": None,
            "currentPlayer": None,
        }

    rows = [
        (row.player_id, row.puzzles_solved or 0)
        for row in db.execute(
            select(WinamGameSession.player_id, WinamGameSession.puzzles_solved)
            .where(WinamGameSession.draw_week_id == week.id)
            .where(WinamGameSession.puzzles_solved > 0)
        ).all()
    ]
    base = _build_rows(db, rows, limit, player_id)
    return {
        "success": True,
        **base,
        "weekStartWat": week.week_start_wat.isoformat(),
        "weekEndWat": week.week_end_wat.isoformat(),
        "drawExecutesAt": week.draw_executes_at.isoformat(),
    }


@router.get("/daily")
def daily_leaderboard(limit: int = 50, player_id: str | None = None, db: Session = Depends(get_db)) -> dict[str, object]:
    today = wat_date()
    rows = [
        (row.player_id, row.puzzles_solved or 0)
        for row in db.execute(
            select(WinamGameSession.player_id, WinamGameSession.puzzles_solved)
            .where(WinamGameSession.session_date_wat == today)
            .where(WinamGameSession.puzzles_solved > 0)
        ).all()
    ]
    base = _build_rows(db, rows, limit, player_id)
    return {
        "success": True,
        **base,
        "todayWat": today.isoformat(),
    }
