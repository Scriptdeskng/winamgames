from __future__ import annotations

from sqlalchemy import select

from app.db.session import SessionLocal
from app.domain.models import WinamAdminUser, WinamWinner
from app.services.draws import get_or_create_current_draw_week
from app.api.v1.endpoints.admin_draws import AdminDrawPayload, execute_draw, lock_draw, publish_draw, settle_draw
from scripts.gameplay_flow_test import main as gameplay_seed_main
from scripts.seed import seed_database


def main() -> None:
    seed_database()
    gameplay_seed_main()

    db = SessionLocal()
    try:
        admin = db.execute(select(WinamAdminUser).order_by(WinamAdminUser.created_at.asc())).scalar_one()
        week = get_or_create_current_draw_week(db)

        print("\nAdmin draw smoke test:")
        print(f"  admin={admin.email}")
        print(f"  week={week.id}")
        print(f"  initial_status={week.status.value}")

        lock_result = lock_draw(AdminDrawPayload(admin_id=admin.id, draw_week_id=week.id), db=db)
        db.refresh(week)
        print(f"  lock_result={lock_result}")
        print(f"  status_after_lock={week.status.value}")

        execute_result = execute_draw(AdminDrawPayload(admin_id=admin.id, draw_week_id=week.id), db=db)
        db.refresh(week)
        print(f"  execute_result={execute_result}")
        print(f"  status_after_execute={week.status.value}")

        publish_result = publish_draw(AdminDrawPayload(admin_id=admin.id, draw_week_id=week.id), db=db)
        db.refresh(week)
        print(f"  publish_result={publish_result}")
        print(f"  status_after_publish={week.status.value}")

        settle_result = settle_draw(AdminDrawPayload(admin_id=admin.id, draw_week_id=week.id), db=db)
        db.refresh(week)
        print(f"  settle_result={settle_result}")
        print(f"  status_after_settle={week.status.value}")

        winners = db.execute(select(WinamWinner).where(WinamWinner.draw_week_id == week.id)).scalars().all()
        print(f"  winners_count={len(winners)}")
        print("Admin draw smoke test complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
