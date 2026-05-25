from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class IntelliResponse:
    success: bool
    message: str | None = None
    data: dict[str, Any] | None = None
    raw: dict[str, Any] | None = None


def is_mock_mode() -> bool:
    return settings.intelli_mock or not settings.intelli_base_url


def normalize_msisdn_for_intelli(raw: str) -> str:
    digits = "".join(ch for ch in raw if ch.isdigit())
    if digits.startswith("0"):
        digits = "234" + digits[1:]
    return digits


def _request(method: str, path: str, payload: dict[str, Any] | None = None) -> IntelliResponse:
    if is_mock_mode():
        return IntelliResponse(success=False, message="Intelli mock mode requires a local service handler", raw={})

    base = settings.intelli_base_url.rstrip("/")
    url = f"{base}{path}"
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=body,
        method=method.upper(),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=20) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        try:
            raw = json.loads(error.read().decode("utf-8"))
        except Exception:
            raw = {"success": False, "message": str(error)}
        logger.warning(
            "Intelli %s %s failed with HTTP %s: %s",
            method.upper(),
            path,
            getattr(error, "code", "unknown"),
            raw,
        )
    except URLError as error:
        logger.exception("Failed to reach Intelli for %s %s: %s", method.upper(), path, error.reason)
        raise RuntimeError(f"Failed to reach Intelli: {error.reason}") from error

    response = IntelliResponse(
        success=bool(raw.get("success")),
        message=raw.get("message"),
        data=raw.get("data") if isinstance(raw.get("data"), dict) else None,
        raw=raw if isinstance(raw, dict) else None,
    )
    logger.warning(
        "Intelli %s %s response: success=%s message=%s raw=%s",
        method.upper(),
        path,
        response.success,
        response.message,
        response.raw,
    )
    return response


def send_otp(msisdn: str) -> IntelliResponse:
    normalized = normalize_msisdn_for_intelli(msisdn)
    return _request(
        "POST",
        f"/service/{settings.intelli_service_path_id}/auth/send-otp/",
        {"msisdn": normalized, "telco": settings.intelli_telco},
    )


def verify_otp(msisdn: str, otp: str) -> IntelliResponse:
    return _request(
        "POST",
        f"/service/{settings.intelli_service_path_id}/auth/verify-otp/",
        {"msisdn": msisdn, "otp": otp},
    )


def subscription_status(msisdn: str) -> IntelliResponse:
    return _request(
        "GET",
        f"/service/{settings.intelli_service_path_id}/subscription/status/?msisdn={msisdn}",
        None,
    )
