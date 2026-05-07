from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.admin_auth import admin_login, verify_admin_session

router = APIRouter()


class AdminLoginPayload(BaseModel):
    email: str
    password: str


class AdminVerifyPayload(BaseModel):
    admin_id: str


@router.post("/login")
def login(payload: AdminLoginPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    return admin_login(db, payload.email, payload.password)


@router.post("/verify")
def verify(payload: AdminVerifyPayload, db: Session = Depends(get_db)) -> dict[str, object]:
    return verify_admin_session(db, payload.admin_id)
