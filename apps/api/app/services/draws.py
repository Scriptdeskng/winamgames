from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.enums import DrawWeekStatus
from app.domain.models import WinamDrawWeek


WAT = timezone(timedelta(hours=1))


def wat_now() -> datetime:
    return datetime.now(timezone.utc).astimezone(WAT)


def wat_date(value: datetime | None = None) -> date:
    return (value or wat_now()).date()


def wat_week_bounds(anchor: datetime | None = None) -> tuple[date, date]:
    current = (anchor or wat_now()).astimezone(WAT)
    days_since_monday = (current.weekday() + 0) % 7
    monday = current.date() - timedelta(days=days_since_monday)
    sunday = monday + timedelta(days=6)
    return monday, sunday


def get_current_draw_week(db: Session) -> WinamDrawWeek | None:
    now = wat_now()
    stmt = (
        select(WinamDrawWeek)
        .where(WinamDrawWeek.status.in_([DrawWeekStatus.open, DrawWeekStatus.locked]))
        .order_by(WinamDrawWeek.week_start_wat.desc())
        .limit(1)
    )
    week = db.execute(stmt).scalar_one_or_none()
    if week and week.entry_lock_at and week.entry_lock_at <= now:
        return week
    return week


def create_current_draw_week(db: Session) -> WinamDrawWeek:
    monday, sunday = wat_week_bounds()
    entry_lock_at = datetime.combine(sunday, time(18, 0), tzinfo=WAT)
    draw_executes_at = datetime.combine(sunday, time(19, 0), tzinfo=WAT)

    week = WinamDrawWeek(
        week_start_wat=monday,
        week_end_wat=sunday,
        entry_lock_at=entry_lock_at,
        draw_executes_at=draw_executes_at,
        status=DrawWeekStatus.open,
        total_entries=0,
    )
    db.add(week)
    db.commit()
    db.refresh(week)
    return week


def get_or_create_current_draw_week(db: Session) -> WinamDrawWeek:
    week = get_current_draw_week(db)
    if week is not None:
        return week
    return create_current_draw_week(db)


def ensure_draw_week(db: Session) -> WinamDrawWeek:
    week = get_current_draw_week(db)
    if week:
        return week
    return create_current_draw_week(db)
