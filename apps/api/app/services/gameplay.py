from __future__ import annotations

import json
import random
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.enums import EntrySourceType, GameType, PuzzleResult
from app.domain.models import (
    WinamCheckmatePuzzle,
    WinamEntryLedger,
    WinamGameSession,
    WinamPlayer,
    WinamPuzzleAttempt,
    WinamWisdomPuzzle,
)
from app.services.draws import get_or_create_current_draw_week, wat_date, wat_now
from app.services.missions import evaluate_pending_missions


def _rank_thresholds(xp_total: int) -> str:
    if xp_total >= 10000:
        return "immortal"
    if xp_total >= 7000:
        return "legend"
    if xp_total >= 4500:
        return "icon"
    if xp_total >= 2500:
        return "champion"
    if xp_total >= 1200:
        return "veteran"
    if xp_total >= 500:
        return "sergeant"
    if xp_total >= 150:
        return "recruit"
    return "starter"


def _parse_wisdom_accuracy(session_id: str, db: Session) -> int:
    attempts = list(
        db.execute(select(WinamPuzzleAttempt.result).where(WinamPuzzleAttempt.session_id == session_id)).all()
    )
    total = len(attempts)
    correct = sum(1 for row in attempts if row[0].value == "correct")
    return round((correct / total) * 100) if total > 0 else 0


def _checkmate_mix(rank_tier: str) -> dict[str, int]:
    return {
        "starter": {"1": 7, "2": 2, "3": 1},
        "recruit": {"1": 5, "2": 4, "3": 1},
        "sergeant": {"1": 3, "2": 5, "3": 2},
        "veteran": {"1": 1, "2": 5, "3": 4},
        "champion": {"1": 1, "2": 5, "3": 4},
        "icon": {"1": 1, "2": 5, "3": 4},
        "legend": {"1": 1, "2": 5, "3": 4},
        "immortal": {"1": 1, "2": 5, "3": 4},
    }.get(rank_tier, {"1": 7, "2": 2, "3": 1})


def _wisdom_mix(rank_tier: str, last_accuracy: int | None) -> dict[str, int]:
    mix = {
        "starter": {"beginner": 7, "intermediate": 2, "advanced": 1},
        "recruit": {"beginner": 5, "intermediate": 4, "advanced": 1},
        "sergeant": {"beginner": 3, "intermediate": 5, "advanced": 2},
        "veteran": {"beginner": 1, "intermediate": 5, "advanced": 4},
        "champion": {"beginner": 1, "intermediate": 5, "advanced": 4},
        "icon": {"beginner": 1, "intermediate": 5, "advanced": 4},
        "legend": {"beginner": 1, "intermediate": 5, "advanced": 4},
        "immortal": {"beginner": 1, "intermediate": 5, "advanced": 4},
    }.get(rank_tier, {"beginner": 7, "intermediate": 2, "advanced": 1})

    adjusted = dict(mix)
    if last_accuracy is not None:
        if last_accuracy >= 90:
            shift = min(2, adjusted["beginner"])
            adjusted["beginner"] -= shift
            adjusted["advanced"] += shift
        elif last_accuracy < 50:
            shift = min(2, adjusted["advanced"])
            adjusted["beginner"] += shift
            adjusted["advanced"] -= shift
    return adjusted


def _pick_checkmate_puzzles(db: Session, rank_tier: str) -> list[WinamCheckmatePuzzle]:
    mix = _checkmate_mix(rank_tier)
    puzzles = list(db.execute(select(WinamCheckmatePuzzle)).scalars())
    buckets: dict[str, list[WinamCheckmatePuzzle]] = {"1": [], "2": [], "3": []}
    for puzzle in puzzles:
        buckets.setdefault(str(puzzle.difficulty), []).append(puzzle)
    for bucket in buckets.values():
        random.shuffle(bucket)

    picked: list[WinamCheckmatePuzzle] = []

    def take(key: str, count: int) -> int:
        taken = 0
        while taken < count and buckets[key]:
            picked.append(buckets[key].pop())
            taken += 1
        return taken

    adv_taken = take("3", mix["3"])
    adv_short = mix["3"] - adv_taken
    int_target = mix["2"] + adv_short
    int_taken = take("2", int_target)
    int_short = int_target - int_taken
    beg_target = mix["1"] + int_short
    beg_taken = take("1", beg_target)
    beg_short = beg_target - beg_taken
    if beg_short > 0:
        beg_short -= take("2", beg_short)
    if beg_short > 0:
        take("3", beg_short)

    if not picked:
        return []
    return picked[:10]


def _pick_wisdom_puzzles(db: Session, player_id: str, rank_tier: str) -> list[WinamWisdomPuzzle]:
    last_accuracy = db.execute(
        select(WinamGameSession.wisdom_accuracy)
        .where(WinamGameSession.player_id == player_id)
        .where(WinamGameSession.game_type == GameType.wisdomdrop)
        .where(WinamGameSession.wisdom_accuracy.is_not(None))
        .order_by(WinamGameSession.completed_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    mix = _wisdom_mix(rank_tier, int(last_accuracy) if last_accuracy is not None else None)
    puzzles = list(db.execute(select(WinamWisdomPuzzle)).scalars())
    buckets: dict[str, list[WinamWisdomPuzzle]] = {"beginner": [], "intermediate": [], "advanced": []}
    for puzzle in puzzles:
        buckets.setdefault(puzzle.difficulty, []).append(puzzle)
    for bucket in buckets.values():
        random.shuffle(bucket)

    picked: list[WinamWisdomPuzzle] = []

    def take(key: str, count: int) -> int:
        taken = 0
        while taken < count and buckets[key]:
            picked.append(buckets[key].pop())
            taken += 1
        return taken

    adv_taken = take("advanced", mix["advanced"])
    adv_short = mix["advanced"] - adv_taken
    int_target = mix["intermediate"] + adv_short
    int_taken = take("intermediate", int_target)
    int_short = int_target - int_taken
    beg_target = mix["beginner"] + int_short
    beg_taken = take("beginner", beg_target)
    beg_short = beg_target - beg_taken
    if beg_short > 0:
        beg_short -= take("intermediate", beg_short)
    if beg_short > 0:
        take("advanced", beg_short)

    if not picked:
        return []
    return picked[:6]


def start_game_session(db: Session, player_id: str, game_type: GameType) -> dict:
    week = get_or_create_current_draw_week(db)
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        raise ValueError("Player not found")

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

    if game_type == GameType.checkmate:
        picked = _pick_checkmate_puzzles(db, player.rank_tier.value)
        puzzle_list = [
            {
                "id": puzzle.id,
                "clientData": {
                    "fen": puzzle.fen,
                    "theme": puzzle.theme,
                    "opponentFrom": puzzle.opponent_from,
                    "opponentTo": puzzle.opponent_to,
                },
            }
            for puzzle in picked
        ]
        first_puzzle = puzzle_list[0] if puzzle_list else None
        if first_puzzle:
            first_puzzle = {"puzzleId": first_puzzle["id"], **first_puzzle["clientData"]}
    else:
        picked = _pick_wisdom_puzzles(db, player_id, player.rank_tier.value)
        puzzle_list = [
            {
                "id": puzzle.id,
                "clientData": {
                    "displayText": puzzle.display_text,
                    "options": puzzle.options,
                    "region": puzzle.region,
                },
            }
            for puzzle in picked
        ]
        first_puzzle = puzzle_list[0] if puzzle_list else None
        if first_puzzle:
            first_puzzle = {"puzzleId": first_puzzle["id"], **first_puzzle["clientData"]}

    if not puzzle_list:
        raise ValueError("No puzzles available")

    return {
        "success": True,
        "sessionId": session.id,
        "drawWeekId": week.id,
        "puzzleIds": [row["id"] for row in puzzle_list],
        "firstPuzzle": first_puzzle,
        "totalPuzzles": len(puzzle_list),
    }


def submit_puzzle_move(
    db: Session,
    session_id: str,
    puzzle_id: str,
    answer: str,
    time_ms: int,
    next_puzzle_id: str | None = None,
) -> dict:
    session = db.execute(select(WinamGameSession).where(WinamGameSession.id == session_id)).scalar_one_or_none()
    if not session:
        raise ValueError("Session not found")

    is_checkmate = puzzle_id.startswith("lc_") or puzzle_id.startswith("cm-")
    is_correct = False
    reveal_data: dict[str, object] | None = None

    if is_checkmate:
        puzzle = db.execute(select(WinamCheckmatePuzzle).where(WinamCheckmatePuzzle.id == puzzle_id)).scalar_one_or_none()
        if puzzle:
            try:
                parsed = json.loads(answer)
                if isinstance(parsed, dict):
                    move = f"{parsed.get('from', '')}{parsed.get('to', '')}"
                else:
                    move = str(parsed)
            except json.JSONDecodeError:
                move = answer
            is_correct = move == puzzle.solution_move
    else:
        puzzle = db.execute(select(WinamWisdomPuzzle).where(WinamWisdomPuzzle.id == puzzle_id)).scalar_one_or_none()
        if puzzle:
            options = list(puzzle.options or [])
            correct_answer = options[puzzle.correct_index] if 0 <= puzzle.correct_index < len(options) else ""
            is_correct = answer.strip().lower() == correct_answer.strip().lower()
            reveal_data = {
                "correctAnswer": correct_answer,
                "blank": puzzle.blank,
                "originalProverb": puzzle.original_proverb,
                "region": puzzle.region,
                "explanation": puzzle.explanation,
            }

    db.add(
        WinamPuzzleAttempt(
            session_id=session_id,
            puzzle_id=puzzle_id,
            result=PuzzleResult.correct if is_correct else PuzzleResult.incorrect,
            time_to_solve_ms=time_ms,
            moves_submitted=[answer],
        )
    )
    db.commit()

    next_puzzle = None
    if next_puzzle_id:
        if is_checkmate:
            next_puzzle_row = db.execute(
                select(WinamCheckmatePuzzle).where(WinamCheckmatePuzzle.id == next_puzzle_id)
            ).scalar_one_or_none()
            if next_puzzle_row:
                next_puzzle = {
                    "puzzleId": next_puzzle_row.id,
                    "fen": next_puzzle_row.fen,
                    "theme": next_puzzle_row.theme,
                    "opponentFrom": next_puzzle_row.opponent_from,
                    "opponentTo": next_puzzle_row.opponent_to,
                }
        else:
            next_puzzle_row = db.execute(
                select(WinamWisdomPuzzle).where(WinamWisdomPuzzle.id == next_puzzle_id)
            ).scalar_one_or_none()
            if next_puzzle_row:
                options = list(next_puzzle_row.options or [])
                random.shuffle(options)
                next_puzzle = {
                    "puzzleId": next_puzzle_row.id,
                    "displayText": next_puzzle_row.display_text,
                    "options": options,
                    "region": next_puzzle_row.region,
                }

    return {
        "correct": is_correct,
        "submittedAnswer": answer,
        "nextPuzzle": next_puzzle,
        "revealData": reveal_data,
    }


def use_hint(db: Session, player_id: str, puzzle_id: str, tier: int) -> dict:
    costs = {1: 25, 2: 75, 3: 150}
    cost = costs.get(tier, 25)

    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
    if not player:
        return {"success": False, "error": "Player not found"}
    if (player.coin_balance or 0) < cost:
        return {"success": False, "error": "Insufficient coins"}

    is_checkmate = puzzle_id.startswith("lc_") or puzzle_id.startswith("cm-")
    hint_data: dict[str, str] = {}
    if is_checkmate and tier > 2:
        return {"success": False, "error": "Tier 3 hint not available for CheckMate"}

    player.coin_balance = (player.coin_balance or 0) - cost
    if is_checkmate:
        puzzle = db.execute(select(WinamCheckmatePuzzle).where(WinamCheckmatePuzzle.id == puzzle_id)).scalar_one_or_none()
        if puzzle:
            if tier >= 1:
                hint_data["piece"] = puzzle.hint_piece or ""
                hint_data["from"] = puzzle.solution_move[:2]
            if tier >= 2:
                hint_data["destination"] = puzzle.hint_destination or ""
    else:
        puzzle = db.execute(select(WinamWisdomPuzzle).where(WinamWisdomPuzzle.id == puzzle_id)).scalar_one_or_none()
        if puzzle:
            options = list(puzzle.options or [])
            correct_answer = options[puzzle.correct_index] if 0 <= puzzle.correct_index < len(options) else ""
            if tier >= 1:
                wrong = [opt for idx, opt in enumerate(options) if idx != puzzle.correct_index]
                hint_data["eliminate"] = ",".join(wrong[:2])
            if tier >= 2 and correct_answer:
                hint_data["startsWidth"] = correct_answer[0]
            if tier >= 3:
                hint_data["answer"] = correct_answer

    db.commit()
    return {
        "success": True,
        "hintData": hint_data,
        "newBalance": player.coin_balance,
    }


def close_game_session(db: Session, payload) -> dict:
    session = db.execute(
        select(WinamGameSession).where(WinamGameSession.id == payload.session_id)
    ).scalar_one_or_none()
    if not session:
        raise ValueError("Game session not found")
    player = db.execute(select(WinamPlayer).where(WinamPlayer.id == payload.player_id)).scalar_one_or_none()
    if not player:
        raise ValueError("Player not found")

    if session.completed_at is not None:
        return {
            "success": True,
            "entries": session.entries_awarded,
            "sessionEntries": session.entries_awarded,
            "baseEntries": session.entries_awarded,
            "streakBonus": 0,
            "missionEntries": 0,
            "coins": session.coins_awarded,
            "xp": 0,
            "streak": player.current_streak,
            "weekTotal": 0,
            "weekCap": 50,
            "overflow": 0,
            "rankTier": player.rank_tier.value,
            "previousRank": player.rank_tier.value,
            "completedMissions": [],
        }

    puzzles_solved = max(0, payload.puzzles_solved)
    hints_used = max(0, payload.hints_used)
    duration_seconds = max(0, payload.duration_seconds)
    week_cap = 50
    base_entries = puzzles_solved // 5
    week_so_far = (
        db.execute(
            select(WinamEntryLedger.week_total_after)
            .where(WinamEntryLedger.player_id == player.id)
            .where(WinamEntryLedger.draw_week_id == session.draw_week_id)
            .order_by(WinamEntryLedger.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()
        or 0
    )

    wisdom_accuracy: int | None = None
    if session.game_type == GameType.wisdomdrop:
        wisdom_accuracy = _parse_wisdom_accuracy(session.id, db)

    now_wat = wat_now()
    is_lock_window = now_wat.weekday() == 6 and 19 <= now_wat.hour < 20

    previous_rank = player.rank_tier.value
    xp_gained = puzzles_solved * 10
    coins_from_gameplay = puzzles_solved * 5
    current_streak = player.current_streak
    if player.last_session_date is not None:
        diff_days = (wat_date() - player.last_session_date).days
        if diff_days == 1:
            current_streak = player.current_streak + 1
        elif diff_days != 0:
            current_streak = 1

    if is_lock_window or base_entries == 0:
        entries_awarded = 0
        coins_awarded = coins_from_gameplay if is_lock_window else 0
        xp_awarded = xp_gained if is_lock_window else 0
        streak_after = current_streak if is_lock_window else player.current_streak
        rank_after = _rank_thresholds(player.xp_total + xp_awarded)
        session.entries_awarded = 0
        session.coins_awarded = coins_awarded
        session.duration_seconds = duration_seconds
        session.puzzles_solved = puzzles_solved
        session.hints_used = hints_used
        session.completed_at = wat_now()
        if wisdom_accuracy is not None:
            session.wisdom_accuracy = wisdom_accuracy

        player.xp_total = player.xp_total + xp_awarded
        player.coin_balance = player.coin_balance + coins_awarded
        player.current_streak = streak_after
        player.last_session_date = wat_date()
        player.rank_tier = rank_after
        db.commit()

        completed = evaluate_pending_missions(
            db,
            player.id,
            session.draw_week_id,
            session.session_date_wat.isoformat(),
            {"puzzlesSolved": puzzles_solved, "hintsUsed": hints_used, "gameType": session.game_type.value},
        )
        mission_entries = sum(int(m.get("entriesAdded", 0)) for m in completed)
        return {
            "success": True,
            "entries": mission_entries,
            "sessionEntries": 0,
            "baseEntries": 0,
            "streakBonus": 0,
            "missionEntries": mission_entries,
            "coins": coins_awarded,
            "xp": xp_awarded,
            "streak": streak_after,
            "weekTotal": week_so_far + mission_entries,
            "weekCap": week_cap,
            "overflow": 0,
            "rankTier": rank_after,
            "previousRank": previous_rank,
            "completedMissions": completed,
        }

    streak_bonus = 0
    if player.current_streak >= 14:
        streak_bonus = 3
    elif player.current_streak >= 7:
        streak_bonus = 2
    elif player.current_streak >= 3:
        streak_bonus = 1

    raw_entries = base_entries + streak_bonus
    entries_to_add = min(raw_entries, max(0, week_cap - week_so_far))
    overflow = max(0, raw_entries - entries_to_add)
    awarded_base_entries = min(base_entries, entries_to_add)
    awarded_streak_bonus = min(streak_bonus, max(0, entries_to_add - awarded_base_entries))

    coins_from_overflow = overflow * 5
    total_coins = coins_from_gameplay + coins_from_overflow
    rank_after = _rank_thresholds(player.xp_total + xp_gained)

    session.entries_awarded = entries_to_add
    session.coins_awarded = total_coins
    session.duration_seconds = duration_seconds
    session.puzzles_solved = puzzles_solved
    session.hints_used = hints_used
    session.completed_at = wat_now()
    if wisdom_accuracy is not None:
        session.wisdom_accuracy = wisdom_accuracy

    if awarded_base_entries > 0:
        db.add(
            WinamEntryLedger(
                player_id=player.id,
                draw_week_id=session.draw_week_id,
                source_type=EntrySourceType.game_session,
                source_id=session.id,
                entries_delta=awarded_base_entries,
                cap_overflow=awarded_streak_bonus if awarded_streak_bonus > 0 else overflow,
                week_total_after=week_so_far + awarded_base_entries,
            )
        )
    if awarded_streak_bonus > 0:
        db.add(
            WinamEntryLedger(
                player_id=player.id,
                draw_week_id=session.draw_week_id,
                source_type=EntrySourceType.streak,
                source_id=session.id,
                entries_delta=awarded_streak_bonus,
                cap_overflow=overflow,
                week_total_after=week_so_far + awarded_base_entries + awarded_streak_bonus,
            )
        )

    player.xp_total = player.xp_total + xp_gained
    player.coin_balance = player.coin_balance + total_coins
    player.current_streak = current_streak
    player.last_session_date = wat_date()
    player.rank_tier = rank_after
    db.commit()

    completed = evaluate_pending_missions(
        db,
        player.id,
        session.draw_week_id,
        session.session_date_wat.isoformat(),
        {"puzzlesSolved": puzzles_solved, "hintsUsed": hints_used, "gameType": session.game_type.value},
    )
    mission_entries = sum(int(m.get("entriesAdded", 0)) for m in completed)

    return {
        "success": True,
        "entries": entries_to_add + mission_entries,
        "sessionEntries": entries_to_add,
        "baseEntries": base_entries,
        "streakBonus": streak_bonus,
        "missionEntries": mission_entries,
        "coins": total_coins,
        "xp": xp_gained,
        "streak": current_streak,
        "weekTotal": week_so_far + entries_to_add + mission_entries,
        "weekCap": week_cap,
        "overflow": overflow,
        "rankTier": rank_after,
        "previousRank": previous_rank,
        "completedMissions": completed,
    }
