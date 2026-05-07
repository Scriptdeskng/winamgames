from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.subscriptions import apply_intelli_notification

router = APIRouter()


@router.post("/webhook")
def webhook(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, object]:
    return apply_intelli_notification(db, payload)
