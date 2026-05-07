from __future__ import annotations

from datetime import date, datetime, timezone
from random import shuffle

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.enums import EntrySourceType, MissionConditionType, MissionStatus, RewardType
from app.domain.models import WinamEntryLedger, WinamGameSession, WinamMission, WinamPlayer, WinamPlayerMission
from app.services.draws import get_or_create_current_draw_week, wat_date, wat_now


def today_wat_string(value: datetime | None = None) -> str:
    return wat_date(value).isoformat()


def ensure_active_missions(db: Session, player_id: str) -> list[WinamPlayerMission]:
    today = today_wat_string()
    week = get_or_create_current_draw_week(db)

    active = list(
        db.execute(
            select(WinamPlayerMission)
            .where(WinamPlayerMission.player_id == player_id)
            .where(
                (WinamPlayerMission.status == MissionStatus.pending)
                | (
                    (WinamPlayerMission.status == MissionStatus.completed)
                    & (WinamPlayerMission.assigned_date_wat == date.fromisoformat(today))
                )
            )
            .where(WinamPlayerMission.assigned_date_wat == date.fromisoformat(today))
            .order_by(WinamPlayerMission.completed_at.asc().nullsfirst(), WinamPlayerMission.id.asc())
            .limit(3)
        ).scalars()
    )

    carry_over_slots_needed = max(0, 3 - len(active))
    if carry_over_slots_needed > 0:
        old_pending = list(
            db.execute(
                select(WinamPlayerMission)
                .where(WinamPlayerMission.player_id == player_id)
                .where(WinamPlayerMission.status == MissionStatus.pending)
                .where(WinamPlayerMission.assigned_date_wat < date.fromisoformat(today))
                .order_by(WinamPlayerMission.assigned_date_wat.asc(), WinamPlayerMission.id.asc())
                .limit(carry_over_slots_needed)
            ).scalars()
        )
        for mission in old_pending:
            mission.assigned_date_wat = date.fromisoformat(today)
        db.commit()
        active.extend(old_pending)

    active = active[:3]

    slots_available = max(0, 3 - len(active))
    if slots_available > 0 and week:
        pending_ids = [m.mission_id for m in active]
        recent_completed = list(
            db.execute(
                select(WinamPlayerMission.mission_id)
                .where(WinamPlayerMission.player_id == player_id)
                .where(WinamPlayerMission.status == MissionStatus.completed)
                .order_by(WinamPlayerMission.completed_at.desc())
                .limit(3)
            ).scalars()
        )
        ever_completed = list(
            db.execute(
                select(WinamPlayerMission.mission_id, WinamMission.condition_type)
                .join(WinamMission, WinamPlayerMission.mission_id == WinamMission.id)
                .where(WinamPlayerMission.player_id == player_id)
                .where(WinamPlayerMission.status == MissionStatus.completed)
            ).all()
        )
        streak_done = {
            mission_id
            for mission_id, condition_type in ever_completed
            if condition_type == MissionConditionType.streak_day
        }

        exclude = set(pending_ids) | set(recent_completed) | streak_done
        candidates = list(
            db.execute(select(WinamMission.id).where(WinamMission.is_active.is_(True))).scalars()
        )
        pool = [mission_id for mission_id in candidates if mission_id not in exclude]
        if not pool:
            pool = [mission_id for mission_id in candidates if mission_id not in pending_ids]
        shuffle(pool)
        chosen = pool[:slots_available]
        for mission_id in chosen:
            db.add(
                WinamPlayerMission(
                    player_id=player_id,
                    mission_id=mission_id,
                    draw_week_id=week.id,
                    progress_current=0,
                    assigned_date_wat=date.fromisoformat(today),
                    status=MissionStatus.pending,
                )
            )
        db.commit()

        active = list(
            db.execute(
                select(WinamPlayerMission)
                .where(WinamPlayerMission.player_id == player_id)
                .where(WinamPlayerMission.assigned_date_wat == date.fromisoformat(today))
                .order_by(WinamPlayerMission.completed_at.asc().nullsfirst(), WinamPlayerMission.id.asc())
                .limit(3)
            ).scalars()
        )

    return active


def evaluate_pending_missions(
    db: Session,
    player_id: str,
    draw_week_id: str,
    wat_date_str: str,
    session_delta: dict[str, int | str],
) -> list[dict]:
    pending = list(
        db.execute(
            select(WinamPlayerMission)
            .join(WinamMission, WinamPlayerMission.mission_id == WinamMission.id)
            .where(WinamPlayerMission.player_id == player_id)
            .where(WinamPlayerMission.status == MissionStatus.pending)
            .where(WinamPlayerMission.assigned_date_wat == date.fromisoformat(wat_date_str))
            .order_by(WinamPlayerMission.assigned_date_wat.desc(), WinamPlayerMission.id.asc())
            .limit(3)
        ).scalars()
    )
    if not pending:
        return []

    current_streak = (
        db.execute(select(WinamPlayer.current_streak).where(WinamPlayer.id == player_id)).scalar_one_or_none()
        or 0
    )
    week_entries = (
        db.execute(
            select(WinamEntryLedger.week_total_after)
            .where(WinamEntryLedger.player_id == player_id)
            .where(WinamEntryLedger.draw_week_id == draw_week_id)
            .order_by(WinamEntryLedger.created_at.desc())
            .limit(1)
        )
        .scalar_one_or_none()
        or 0
    )
    week_cap = 50
    week_so_far = int(week_entries)

    total_completed: list[dict] = []
    for player_mission in pending:
        mission = player_mission.mission
        if not mission:
            continue

        new_progress = player_mission.progress_current
        condition = mission.condition_type
        if condition == MissionConditionType.puzzles_solved:
            new_progress += int(session_delta.get("puzzlesSolved", 0))
        elif condition == MissionConditionType.streak_day:
            new_progress = current_streak
        elif condition == MissionConditionType.game_type_mix:
            sessions = db.execute(
                select(WinamGameSession.game_type)
                .where(WinamGameSession.player_id == player_id)
            ).all()
            new_progress = len({row[0] for row in sessions})
        elif condition == MissionConditionType.no_hints:
            new_progress = 1 if int(session_delta.get("hintsUsed", 0)) == 0 else player_mission.progress_current

        if new_progress < mission.condition_value:
            if new_progress != player_mission.progress_current:
                player_mission.progress_current = new_progress
                db.commit()
            continue

        entries_to_add = 0
        overflow = 0
        coins_awarded = 0
        if mission.reward_type == RewardType.entries:
            entries_to_add = min(mission.reward_amount, max(0, week_cap - week_so_far))
            overflow = mission.reward_amount - entries_to_add
        elif mission.reward_type == RewardType.coins:
            coins_awarded = mission.reward_amount

        player_mission.progress_current = mission.condition_value
        player_mission.status = MissionStatus.completed
        player_mission.completed_at = datetime.now(timezone.utc)
        player_mission.entries_awarded = mission.reward_amount
        db.add(player_mission)

        if entries_to_add > 0 and mission.reward_type == RewardType.entries:
            db.add(
                WinamEntryLedger(
                    player_id=player_id,
                    draw_week_id=draw_week_id,
                    source_type=EntrySourceType.mission,
                    source_id=player_mission.id,
                    entries_delta=entries_to_add,
                    cap_overflow=overflow,
                    week_total_after=week_so_far + entries_to_add,
                )
            )
            week_so_far += entries_to_add

        if coins_awarded > 0:
            player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one_or_none()
            if player is not None:
                player.coin_balance = (player.coin_balance or 0) + coins_awarded

        db.commit()
        total_completed.append(
            {
                "missionId": player_mission.mission_id,
                "playerMissionId": player_mission.id,
                "title": mission.title,
                "rewardAmount": mission.reward_amount,
                "entriesAdded": entries_to_add,
                "coinsAwarded": coins_awarded,
                "capOverflow": overflow,
            }
        )

    return total_completed
