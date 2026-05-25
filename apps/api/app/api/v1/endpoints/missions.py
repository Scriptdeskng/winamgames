from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.missions import ensure_active_missions
from app.services.session_tokens import PLAYER_SESSION_COOKIE, require_session_subject

router = APIRouter()


@router.get("/active")
def active_missions(player_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    require_session_subject(
        request,
        cookie_name=PLAYER_SESSION_COOKIE,
        expected_kind="player",
        provided_subject=player_id,
    )
    missions = ensure_active_missions(db, player_id)
    return {
        "success": True,
        "missions": [
            {
                "id": mission.id,
                "title": mission.mission.title if mission.mission else "",
                "conditionType": mission.mission.condition_type.value if mission.mission else "puzzles_solved",
                "conditionValue": mission.mission.condition_value if mission.mission else 1,
                "progressCurrent": mission.progress_current,
                "rewardAmount": mission.mission.reward_amount if mission.mission else 0,
                "rewardType": mission.mission.reward_type.value if mission.mission else "entries",
                "status": mission.status.value,
                "assignedDateWat": mission.assigned_date_wat.isoformat() if mission.assigned_date_wat else None,
                "completedAt": mission.completed_at.isoformat() if mission.completed_at else None,
            }
            for mission in missions
        ],
    }
