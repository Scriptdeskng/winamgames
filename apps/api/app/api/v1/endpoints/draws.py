from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.models import WinamDrawWeek
from app.services.draws import get_or_create_current_draw_week

router = APIRouter()


@router.get("/current")
def current_draw(db: Session = Depends(get_db)) -> dict[str, object]:
    week: WinamDrawWeek = get_or_create_current_draw_week(db)
    return {
        "id": week.id,
        "week_start_wat": week.week_start_wat.isoformat(),
        "week_end_wat": week.week_end_wat.isoformat(),
        "status": week.status.value,
        "entry_lock_at": week.entry_lock_at.isoformat(),
        "draw_executes_at": week.draw_executes_at.isoformat(),
        "total_entries": week.total_entries,
    }
