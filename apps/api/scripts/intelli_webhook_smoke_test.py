from __future__ import annotations

import json
import os
import urllib.request
from urllib.error import URLError

from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.domain.models import WinamIntelliEvent, WinamPlayer, WinamSubscription
from app.services.draws import get_or_create_current_draw_week
from scripts.seed import seed_database


WEBHOOK_URLS = [
    os.environ.get("WINAM_INTELLI_WEBHOOK_URL", "").strip(),
    "http://api:8000/api/v1/integrations/intelli/webhook",
    "http://host.docker.internal:8000/api/v1/integrations/intelli/webhook",
    "http://127.0.0.1:8000/api/v1/integrations/intelli/webhook",
]

SYNC_PAYLOAD = {
    "type": "SYNC_NOTIFICATION",
    "telco": "MTN",
    "action": "NONE",
    "shortcode": None,
    "product": {
        "id": "23410220000050880",
        "name": "Parrot FM Podcast Service",
        "identity": "23410220000050880",
        "type": "SUBSCRIPTION",
        "subscription_type": "ONETIME_AND_RECURRING",
        "status": "LIVE",
    },
    "details": {
        "phone": "2347062337448",
        "amount": 0.0,
        "channel": "Evina",
        "date": "2026-05-07 11:04:35",
        "expiry": "2026-05-08",
        "auto_renewal": True,
        "telco_status_code": "0",
        "telco_ref": "26383427524221722441326978000000000000000000000000",
        "sequence_no": "441326978",
    },
}

RENEWAL_PAYLOAD = {
    "type": "RENEWAL_NOTIFICATION",
    "telco": "MTN",
    "action": "NONE",
    "shortcode": None,
    "product": {
        "id": "23410220000050019",
        "name": "Gamez Hood",
        "identity": "23410220000050019",
        "type": "SUBSCRIPTION",
        "subscription_type": "ONETIME_AND_RECURRING",
        "status": "LIVE",
    },
    "details": {
        "phone": "2348138838333",
        "amount": 100.0,
        "channel": "system-renewal",
        "date": "2026-05-07 11:03:35",
        "expiry": "2026-05-08",
        "auto_renewal": True,
        "telco_status_code": "0",
        "telco_ref": "26904869808541947269048698085425990000000000000000",
        "sequence_no": "26904869808542599",
    },
}

UNSUB_PAYLOAD = {
    "type": "UNSUBSCRIPTION_NOTIFICATION",
    "telco": "",
    "action": "NONE",
    "shortcode": None,
    "product": {
        "id": "23410220000027079",
        "name": "Video Berekete",
        "identity": "23410220000027079",
        "type": "UNSUBSCRIPTION",
        "subscription_type": "ONETIME_AND_RECURRING",
        "status": "LIVE",
    },
    "details": {
        "phone": "2347033333817",
        "amount": 150.0,
        "channel": "USSD",
        "date": "2026-05-07 11:05:40",
        "expiry": "2026-05-08",
        "auto_renewal": True,
        "telco_status_code": "0",
        "telco_ref": "26900071913471680269000719140852230000000000000000",
        "bearerId": "USSD",
    },
}


def _post(payload: dict[str, object]) -> dict[str, object]:
    errors: list[str] = []
    for url in [url for url in WEBHOOK_URLS if url]:
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except URLError as error:
            errors.append(f"{url}: {error.reason}")
    raise RuntimeError("Unable to reach Intelli webhook endpoint: " + "; ".join(errors))


def main() -> None:
    seed_database()

    db = SessionLocal()
    try:
        before = db.execute(select(func.count()).select_from(WinamIntelliEvent)).scalar_one()
        print("Initial Intelli events:")
        print(f"  count={before}")

        responses = [_post(payload) for payload in (SYNC_PAYLOAD, RENEWAL_PAYLOAD, UNSUB_PAYLOAD)]
        print("\nWebhook responses:")
        for response in responses:
            print(f"  {response}")

        after = db.execute(select(func.count()).select_from(WinamIntelliEvent)).scalar_one()
        print("\nStored Intelli events:")
        print(f"  count={after}")

        players = list(
            db.execute(
                select(WinamPlayer.msisdn, WinamSubscription.status)
                .join(WinamSubscription, WinamSubscription.player_id == WinamPlayer.id)
                .order_by(WinamSubscription.created_at.desc())
            ).all()
        )
        print("  subscription snapshots=" + ", ".join(f"{msisdn}:{status.value}" for msisdn, status in players))

        if after < before + 3:
            raise RuntimeError("Expected three Intelli events to be stored")

        print("\nIntelli webhook smoke test complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
