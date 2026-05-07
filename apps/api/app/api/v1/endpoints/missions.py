from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.missions import ensure_active_missions

router = APIRouter()


@router.get("/active")
def active_missions(player_id: str, db: Session = Depends(get_db)) -> dict[str, object]:
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
            }
            for mission in missions
        ],
    }
