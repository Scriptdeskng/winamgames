from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

from fastapi import HTTPException, Request

from app.core.config import settings

PLAYER_SESSION_COOKIE = "winam_player_session"
ADMIN_SESSION_COOKIE = "winam_admin_session"


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_session_token(subject: str, kind: str, *, ttl_seconds: int = 30 * 24 * 60 * 60) -> str:
    now = int(time.time())
    payload = {
        "sub": subject,
        "kind": kind,
        "iat": now,
        "exp": now + ttl_seconds,
    }
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_b64 = _b64encode(payload_json)
    signature = hmac.new(
        settings.session_secret.encode("utf-8"),
        payload_b64.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{payload_b64}.{_b64encode(signature)}"


def verify_session_token(token: str, expected_kind: str) -> dict[str, object] | None:
    try:
        payload_b64, signature_b64 = token.split(".", 1)
        expected_sig = hmac.new(
            settings.session_secret.encode("utf-8"),
            payload_b64.encode("ascii"),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(expected_sig, _b64decode(signature_b64)):
            return None
        payload = json.loads(_b64decode(payload_b64))
    except Exception:
        return None

    if not isinstance(payload, dict):
        return None
    if payload.get("kind") != expected_kind:
        return None
    exp = payload.get("exp")
    if not isinstance(exp, int) or exp <= int(time.time()):
        return None
    return payload


def require_session_subject(
    request: Request,
    *,
    cookie_name: str,
    expected_kind: str,
    provided_subject: str | None = None,
) -> str:
    token = request.cookies.get(cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    payload = verify_session_token(token, expected_kind)
    if not payload:
        raise HTTPException(status_code=401, detail="Unauthorized")
    subject = str(payload["sub"])
    if provided_subject is not None and provided_subject != subject:
        raise HTTPException(status_code=403, detail="Forbidden")
    return subject
