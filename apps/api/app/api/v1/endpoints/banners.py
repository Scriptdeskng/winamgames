from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.domain.models import WinamBanner

router = APIRouter()


@router.get("/active")
def active_banners(db: Session = Depends(get_db)) -> dict[str, object]:
    banners = list(
        db.execute(
            select(WinamBanner)
            .where(WinamBanner.is_active.is_(True))
            .order_by(WinamBanner.display_order.asc(), WinamBanner.created_at.asc())
            .limit(3)
        ).scalars()
    )
    return {
        "success": True,
        "banners": [
            {
                "id": banner.id,
                "title": banner.title,
                "subtitle": banner.subtitle,
                "iconUrl": banner.icon_url,
                "displayOrder": banner.display_order,
            }
            for banner in banners
        ],
    }
