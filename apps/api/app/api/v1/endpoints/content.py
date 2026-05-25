from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.db.session import get_db
from app.domain.models import WinamPlatformConfig

router = APIRouter()


def _to_bool(value: object, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"1", "true", "yes", "on"}:
            return True
        if lowered in {"0", "false", "no", "off"}:
            return False
    return default


@router.get("/public")
def public_content(db: Session = Depends(get_db)) -> dict[str, object]:
    rows = db.execute(select(WinamPlatformConfig)).scalars().all()
    config = {row.key: row.value for row in rows}

    announcement_image_url = config.get("announcement_image_url")
    announcement = {
        "id": "platform-announcement",
        "image_url": str(announcement_image_url) if announcement_image_url else "",
        "cta_label": str(config.get("announcement_cta_label")) if config.get("announcement_cta_label") else None,
        "cta_url": str(config.get("announcement_cta_url")) if config.get("announcement_cta_url") else None,
        "frequency": str(config.get("announcement_frequency") or "once_per_week"),
        "orientation": str(config.get("announcement_orientation") or "portrait"),
        "is_active": _to_bool(config.get("announcement_is_active"), bool(announcement_image_url)),
    }

    return {
        "success": True,
        "support": {
            "email": str(config.get("support_email")) if config.get("support_email") else "",
            "whatsapp": str(config.get("support_whatsapp")) if config.get("support_whatsapp") else "",
        },
        "announcement": announcement,
    }
