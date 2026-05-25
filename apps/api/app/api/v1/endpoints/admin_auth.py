from datetime import timedelta

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.domain.models import WinamAdminUser
from app.services.admin_auth import admin_login, verify_admin_session
from app.services.session_tokens import ADMIN_SESSION_COOKIE, create_session_token, verify_session_token

router = APIRouter()


class AdminLoginPayload(BaseModel):
    email: str
    password: str


class AdminVerifyPayload(BaseModel):
    admin_id: str


def _admin_cookie_kwargs() -> dict[str, object]:
    return {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "path": "/",
        "max_age": int(timedelta(days=30).total_seconds()),
    }


@router.post("/login")
def login(payload: AdminLoginPayload, response: Response, db: Session = Depends(get_db)) -> dict[str, object]:
    result = admin_login(db, payload.email, payload.password)
    if result.get("success") and isinstance(result.get("session"), dict):
        admin_id = str(result["session"]["adminId"])
        token = create_session_token(admin_id, "admin")
        response.set_cookie(ADMIN_SESSION_COOKIE, token, **_admin_cookie_kwargs())
    return result


@router.post("/verify")
def verify(payload: AdminVerifyPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    return verify_admin_session(db, payload.admin_id)


@router.get("/session")
def session_route(request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    token = request.cookies.get(ADMIN_SESSION_COOKIE)
    if not token:
        return {"valid": False}
    payload = verify_session_token(token, "admin")
    if not payload:
        return {"valid": False}
    admin = db.execute(select(WinamAdminUser).where(WinamAdminUser.id == str(payload["sub"]))).scalar_one_or_none()
    if not admin:
        return {"valid": False}
    return {
        "valid": True,
        "session": {
            "adminId": admin.id,
            "email": admin.email,
            "role": admin.role,
        },
        "expiresAt": payload["exp"],
    }


@router.post("/logout")
def logout_route(response: Response) -> dict[str, object]:
    response.delete_cookie(ADMIN_SESSION_COOKIE, path="/")
    return {"success": True}
