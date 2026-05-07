from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import timedelta
from types import SimpleNamespace
from uuid import uuid4

from sqlalchemy import select

from app.db.session import SessionLocal
from app.domain.enums import GameType, MissionStatus, RankTier
from app.domain.models import (
    WinamCheckmatePuzzle,
    WinamEntryLedger,
    WinamMission,
    WinamPlayer,
    WinamPlayerMission,
    WinamWisdomPuzzle,
)
from app.services.auth import send_otp, set_nickname, verify_otp
from app.services.draws import get_or_create_current_draw_week, wat_date
from app.services.gameplay import close_game_session, start_game_session, submit_puzzle_move, use_hint
from scripts.seed import seed_database


@dataclass
class SessionOutcome:
    label: str
    result: dict[str, object]


def _unique_msisdn() -> str:
    suffix = int(uuid4().int % 1_000_000)
    return f"08010{suffix:06d}"


def _get_mission(db, title: str) -> WinamMission:
    mission = db.execute(select(WinamMission).where(WinamMission.title == title)).scalar_one_or_none()
    if not mission:
        raise RuntimeError(f"Mission not found: {title}")
    return mission


def _seed_player(db) -> WinamPlayer:
    msisdn = _unique_msisdn()
    send_otp(db, msisdn)
    auth = verify_otp(db, msisdn, "0000")
    if not auth.get("success"):
        raise RuntimeError(f"OTP verification failed: {auth}")

    player_id = str(auth["playerId"])
    nickname = f"SeedTester{msisdn[-4:]}"
    nickname_result = set_nickname(db, player_id, nickname)
    if not nickname_result.get("success"):
        raise RuntimeError(f"Nickname setup failed: {nickname_result}")

    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one()
    player.coin_balance = 200
    player.xp_total = 0
    player.current_streak = 7
    player.rank_tier = RankTier.starter
    player.last_session_date = wat_date() - timedelta(days=1)
    db.commit()
    db.refresh(player)
    return player


def _replace_player_missions(db, player_id: str, titles: list[str]) -> None:
    week = get_or_create_current_draw_week(db)
    today = wat_date()
    db.query(WinamPlayerMission).filter(WinamPlayerMission.player_id == player_id).delete()
    db.commit()

    for title in titles:
        mission = _get_mission(db, title)
        db.add(
            WinamPlayerMission(
                player_id=player_id,
                mission_id=mission.id,
                draw_week_id=week.id,
                status=MissionStatus.pending,
                progress_current=0,
                assigned_date_wat=today,
            )
        )
    db.commit()


def _solve_session(db, session_result: dict[str, object], game_type: GameType, limit: int) -> tuple[int, list[str]]:
    session_id = str(session_result["sessionId"])
    puzzle_ids = [str(pid) for pid in session_result["puzzleIds"][:limit]]
    solved = 0
    answers: list[str] = []

    for index, puzzle_id in enumerate(puzzle_ids):
        next_puzzle_id = puzzle_ids[index + 1] if index + 1 < len(puzzle_ids) else None
        if game_type == GameType.checkmate:
            puzzle = db.execute(select(WinamCheckmatePuzzle).where(WinamCheckmatePuzzle.id == puzzle_id)).scalar_one()
            answer = json.dumps({"from": puzzle.solution_move[:2], "to": puzzle.solution_move[2:]})
        else:
            puzzle = db.execute(select(WinamWisdomPuzzle).where(WinamWisdomPuzzle.id == puzzle_id)).scalar_one()
            answer = str(puzzle.options[puzzle.correct_index])

        answers.append(answer)
        move_result = submit_puzzle_move(db, session_id, puzzle_id, answer, 850, next_puzzle_id)
        if not move_result.get("correct"):
            raise RuntimeError(f"Puzzle {puzzle_id} was not marked correct: {move_result}")
        solved += 1

    return solved, answers


def _close_session(db, session_result: dict[str, object], player_id: str, label: str, puzzles_solved: int, hints_used: int) -> SessionOutcome:
    payload = SimpleNamespace(
        session_id=str(session_result["sessionId"]),
        player_id=player_id,
        duration_seconds=180,
        puzzles_solved=puzzles_solved,
        hints_used=hints_used,
    )
    result = close_game_session(db, payload)
    return SessionOutcome(label=label, result=result)


def main() -> None:
    seed_database()

    db = SessionLocal()
    try:
        player = _seed_player(db)
        week = get_or_create_current_draw_week(db)

        print("Seed player:")
        print(f"  id={player.id}")
        print(f"  nickname={player.nickname}")
        print(f"  coin_balance={player.coin_balance}")
        print(f"  xp_total={player.xp_total}")
        print(f"  streak={player.current_streak}")
        print(f"  draw_week={week.id}")

        _replace_player_missions(
            db,
            player.id,
            [
                "Solve 10 puzzles",
                "Finish a no-hint run",
                "Keep a 3-day streak",
            ],
        )

        print("\nInitial missions:")
        for row in db.execute(
            select(WinamPlayerMission, WinamMission.title)
            .join(WinamMission, WinamPlayerMission.mission_id == WinamMission.id)
            .where(WinamPlayerMission.player_id == player.id)
            .order_by(WinamPlayerMission.id.asc())
        ).all():
            mission, title = row
            print(f"  - {title}: {mission.status.value}")

        checkmate_start = start_game_session(db, player.id, GameType.checkmate)
        print("\nCheckMate start:")
        print(f"  sessionId={checkmate_start['sessionId']}")
        print(f"  puzzles={len(checkmate_start['puzzleIds'])}")

        solved_checkmate, _ = _solve_session(db, checkmate_start, GameType.checkmate, 10)
        first_outcome = _close_session(db, checkmate_start, player.id, "checkmate", solved_checkmate, 0)

        print("\nCheckMate close result:")
        for key in ("entries", "sessionEntries", "baseEntries", "streakBonus", "missionEntries", "coins", "xp", "streak", "weekTotal", "rankTier", "previousRank", "overflow"):
            print(f"  {key}={first_outcome.result.get(key)}")

        _replace_player_missions(
            db,
            player.id,
            [
                "Play both game types",
            ],
        )

        wisdom_start = start_game_session(db, player.id, GameType.wisdomdrop)
        print("\nWisdomDrop start:")
        print(f"  sessionId={wisdom_start['sessionId']}")
        print(f"  puzzles={len(wisdom_start['puzzleIds'])}")

        first_wisdom_puzzle_id = str(wisdom_start["puzzleIds"][0])
        hint_result = use_hint(db, player.id, first_wisdom_puzzle_id, 1)
        print("\nHint usage:")
        print(f"  success={hint_result.get('success')}")
        print(f"  newBalance={hint_result.get('newBalance')}")
        print(f"  hintData={hint_result.get('hintData')}")

        solved_wisdom, _ = _solve_session(db, wisdom_start, GameType.wisdomdrop, 5)
        second_outcome = _close_session(db, wisdom_start, player.id, "wisdomdrop", solved_wisdom, 1)

        print("\nWisdomDrop close result:")
        for key in ("entries", "sessionEntries", "baseEntries", "streakBonus", "missionEntries", "coins", "xp", "streak", "weekTotal", "rankTier", "previousRank", "overflow"):
            print(f"  {key}={second_outcome.result.get(key)}")

        db.refresh(player)
        ledger_rows = db.execute(
            select(WinamEntryLedger.source_type, WinamEntryLedger.entries_delta)
            .where(WinamEntryLedger.player_id == player.id)
            .order_by(WinamEntryLedger.created_at.asc())
        ).all()
        total_entries = sum(int(row.entries_delta) for row in ledger_rows)

        print("\nFinal player totals:")
        print(f"  coin_balance={player.coin_balance}")
        print(f"  xp_total={player.xp_total}")
        print(f"  current_streak={player.current_streak}")
        print(f"  rank_tier={player.rank_tier.value}")
        print(f"  ticket_entries_from_ledger={total_entries}")
        print("  ledger_breakdown=" + ", ".join(f"{row.source_type.value}:{row.entries_delta}" for row in ledger_rows))

        missions = db.execute(
            select(WinamPlayerMission, WinamMission.title, WinamMission.reward_type)
            .join(WinamMission, WinamPlayerMission.mission_id == WinamMission.id)
            .where(WinamPlayerMission.player_id == player.id)
            .order_by(WinamPlayerMission.id.asc())
        ).all()
        print("\nMission outcomes:")
        for mission, title, reward_type in missions:
            print(
                f"  - {title}: status={mission.status.value}, progress={mission.progress_current}, "
                f"reward={mission.entries_awarded}, type={reward_type.value}"
            )

        print("\nGameplay seed test complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
