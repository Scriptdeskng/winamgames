from __future__ import annotations

import bcrypt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.models import WinamAdminUser


def admin_login(db: Session, email: str, password: str) -> dict:
    row = db.execute(
        select(WinamAdminUser).where(WinamAdminUser.email == email.lower().strip())
    ).scalar_one_or_none()
    if not row:
        return {"success": False, "error": "Invalid credentials"}
    if not bcrypt.checkpw(password.encode("utf-8"), row.password_hash.encode("utf-8")):
        return {"success": False, "error": "Invalid credentials"}
    return {
        "success": True,
        "session": {
            "adminId": row.id,
            "email": row.email,
            "role": row.role,
        },
    }


def verify_admin_session(db: Session, admin_id: str) -> dict:
    row = db.execute(select(WinamAdminUser).where(WinamAdminUser.id == admin_id)).scalar_one_or_none()
    if not row:
        return {"valid": False}
    return {
        "valid": True,
        "session": {
            "adminId": row.id,
            "email": row.email,
            "role": row.role,
        },
    }
