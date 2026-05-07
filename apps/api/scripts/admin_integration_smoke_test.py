from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any
from urllib.request import urlopen

from sqlalchemy import select

from app.api.v1.endpoints.admin_auth import AdminLoginPayload, AdminVerifyPayload, login as admin_login_route, verify as admin_verify_route
from app.api.v1.endpoints.admin_data import (
    banners as admin_banners_route,
    dashboard_stats as admin_dashboard_stats_route,
    draws as admin_draws_route,
    draw_winners as admin_draw_winners_route,
    intelli_events as admin_intelli_events_route,
    list_players as admin_list_players_route,
    missions as admin_missions_route,
)
from app.api.v1.endpoints.admin_data import platform_config as admin_platform_config_route, player_detail as admin_player_detail_route, player_kyc as admin_player_kyc_route, player_payments as admin_player_payments_route
from app.api.v1.endpoints.admin_draws import AdminDrawPayload, execute_draw, lock_draw, publish_draw, settle_draw
from app.api.v1.endpoints.admin_kyc import VerifyKycPayload, verify_kyc_route
from app.api.v1.endpoints.admin_mutations import (
    AdjustCoinsPayload,
    AdjustXpPayload,
    BannerPayload,
    BannerUpdatePayload,
    ConfigPayload,
    DeleteBannerPayload,
    FlagPlayerPayload,
    KycVerifyPayload,
    MissionPayload,
    MissionUpdatePayload,
    PaymentCreatePayload,
    PaymentMarkPayload,
    UpdateSubscriptionPayload,
    adjust_coins,
    adjust_xp,
    create_banner,
    create_mission,
    create_payment,
    delete_banner,
    flag_player,
    mark_paid,
    update_banner,
    update_config,
    update_mission,
    update_subscription,
)
from app.api.v1.endpoints.admin_winners import FlagWinnerPayload, flag_winner, list_winners
from app.db.session import SessionLocal
from app.domain.enums import DrawWeekStatus
from app.domain.models import (
    WinamAdminUser,
    WinamBanner,
    WinamDrawWeek,
    WinamKyc,
    WinamMission,
    WinamPayment,
    WinamPlayer,
    WinamPlatformConfig,
    WinamSubscription,
    WinamWinner,
)
from app.services.draws import get_or_create_current_draw_week
from app.services.kyc import submit_bank_details, submit_identity
from scripts.gameplay_flow_test import main as gameplay_seed_main
from scripts.seed import seed_database


WEB_BASE = "http://web:3000"


def _assert(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def _fetch(path: str) -> str:
    with urlopen(f"{WEB_BASE}{path}", timeout=20) as response:
        body = response.read().decode("utf-8", errors="replace")
        _assert(response.status == 200, f"{path} returned HTTP {response.status}")
        return body


@contextmanager
def _session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _restore_fields(obj: Any, fields: dict[str, Any]) -> None:
    for key, value in fields.items():
        setattr(obj, key, value)


def _safe_delete(db, obj) -> None:
    db.delete(obj)
    db.commit()


def main() -> None:
    seed_database()
    gameplay_seed_main()

    with _session() as db:
        admin = db.execute(select(WinamAdminUser).order_by(WinamAdminUser.created_at.asc())).scalar_one()
        verify_result = admin_verify_route(AdminVerifyPayload(admin_id=admin.id), db=db)
        _assert(verify_result.get("valid") is True, "Admin session verification failed")

        login_result = admin_login_route(AdminLoginPayload(email=admin.email, password="Admin123!"), db=db)
        _assert(login_result.get("success") is True, "Admin login route failed")

        week = get_or_create_current_draw_week(db)
        if week.status == DrawWeekStatus.locked:
            week.status = DrawWeekStatus.open
            db.commit()
            db.refresh(week)

        print("\nAdmin integration smoke test:")
        print(f"  admin={admin.email}")
        print(f"  week={week.id}")
        print(f"  week_status={week.status.value}")

        dashboard = admin_dashboard_stats_route(admin_id=admin.id, db=db)
        _assert("totalPlayers" in dashboard, "Dashboard stats missing totalPlayers")
        _assert("currentWeekEntries" in dashboard, "Dashboard stats missing currentWeekEntries")

        players = admin_list_players_route(admin_id=admin.id, db=db, search="", page=1, limit=10)
        _assert(players["players"], "Players list is empty")
        player_id = players["players"][0]["id"]

        player_detail = admin_player_detail_route(admin_id=admin.id, player_id=player_id, db=db)
        _assert(player_detail["player"]["id"] == player_id, "Player detail mismatch")

        banners = admin_banners_route(admin_id=admin.id, db=db)
        missions = admin_missions_route(admin_id=admin.id, db=db)
        config = admin_platform_config_route(admin_id=admin.id, db=db)
        intelli = admin_intelli_events_route(admin_id=admin.id, db=db, event_type="", page=1, limit=10)
        draws = admin_draws_route(admin_id=admin.id, db=db)
        _assert("weeks" in draws, "Draws payload missing weeks")

        # Admin mutations: create, update, and clean up temporary records where possible.
        temp_banner = create_banner(
            BannerPayload(
                admin_id=admin.id,
                title="Smoke banner",
                subtitle="Temporary banner for admin smoke test",
                icon_url=None,
                is_active=True,
                display_order=9999,
            ),
            db=db,
        )
        banner_id = temp_banner["banner"]["id"]
        update_banner(
            BannerUpdatePayload(
                admin_id=admin.id,
                banner_id=banner_id,
                title="Smoke banner updated",
                subtitle="Updated temporary banner",
                icon_url=None,
                is_active=False,
                display_order=9998,
            ),
            db=db,
        )
        delete_banner(DeleteBannerPayload(admin_id=admin.id, banner_id=banner_id), db=db)

        mission_rows = list(db.execute(select(WinamMission).order_by(WinamMission.title.asc())).scalars())
        _assert(mission_rows, "No missions available for smoke test")
        mission = mission_rows[0]
        original_mission_state = {
            "title": mission.title,
            "game_type": mission.game_type,
            "condition_type": mission.condition_type,
            "condition_value": mission.condition_value,
            "reward_type": mission.reward_type,
            "reward_amount": mission.reward_amount,
            "is_active": mission.is_active,
        }
        update_mission(
            MissionUpdatePayload(
                admin_id=admin.id,
                mission_id=mission.id,
                title=f"{mission.title} (smoke)",
                is_active=not mission.is_active,
            ),
            db=db,
        )
        db.refresh(mission)
        _restore_fields(mission, original_mission_state)
        db.commit()

        config_rows = list(db.execute(select(WinamPlatformConfig).order_by(WinamPlatformConfig.key.asc())).scalars())
        _assert(config_rows, "No platform config rows available for smoke test")
        config_row = config_rows[0]
        original_config = {"value": config_row.value, "updated_by": config_row.updated_by, "updated_at": config_row.updated_at}
        update_config(
            ConfigPayload(admin_id=admin.id, key=config_row.key, value={"smoke": True, "updated_at": datetime.now(timezone.utc).isoformat()}),
            db=db,
        )
        db.refresh(config_row)
        _restore_fields(config_row, original_config)
        db.commit()

        # Player admin actions with restoration.
        player = db.execute(select(WinamPlayer).where(WinamPlayer.id == player_id)).scalar_one()
        subscription = (
            db.execute(
                select(WinamSubscription)
                .where(WinamSubscription.player_id == player_id)
                .order_by(WinamSubscription.valid_from.desc())
                .limit(1)
            ).scalar_one_or_none()
        )
        original_player_state = {
            "is_flagged": player.is_flagged,
            "flag_reason": player.flag_reason,
            "coin_balance": player.coin_balance,
            "xp_total": player.xp_total,
            "rank_tier": player.rank_tier,
        }
        flag_player(FlagPlayerPayload(admin_id=admin.id, player_id=player_id, flagged=True, reason="Smoke flag"), db=db)
        adjust_coins(AdjustCoinsPayload(admin_id=admin.id, player_id=player_id, amount=25, reason="Smoke coin bonus"), db=db)
        adjust_coins(AdjustCoinsPayload(admin_id=admin.id, player_id=player_id, amount=-25, reason="Smoke coin revert"), db=db)
        adjust_xp(AdjustXpPayload(admin_id=admin.id, player_id=player_id, amount=50, reason="Smoke XP bonus"), db=db)
        adjust_xp(AdjustXpPayload(admin_id=admin.id, player_id=player_id, amount=-50, reason="Smoke XP revert"), db=db)
        if subscription:
            original_subscription_state = {
                "status": subscription.status,
                "valid_until": subscription.valid_until,
                "grace_until": subscription.grace_until,
            }
            update_subscription(UpdateSubscriptionPayload(admin_id=admin.id, player_id=player_id, action="cancel", days=None, reason="Smoke cancel"), db=db)
            update_subscription(UpdateSubscriptionPayload(admin_id=admin.id, player_id=player_id, action="extend", days=7, reason="Smoke extend"), db=db)
            _restore_fields(subscription, original_subscription_state)
            db.commit()
        _restore_fields(player, original_player_state)
        db.commit()

        # Draw lifecycle and winner-side mutations.
        if week.status != DrawWeekStatus.open:
            week.status = DrawWeekStatus.open
            db.commit()
            db.refresh(week)

        lock_draw(AdminDrawPayload(admin_id=admin.id, draw_week_id=week.id), db=db)
        execute_draw(AdminDrawPayload(admin_id=admin.id, draw_week_id=week.id), db=db)
        publish_draw(AdminDrawPayload(admin_id=admin.id, draw_week_id=week.id), db=db)
        settle_draw(AdminDrawPayload(admin_id=admin.id, draw_week_id=week.id), db=db)

        db.refresh(week)
        _assert(week.status == DrawWeekStatus.settled, "Draw week did not settle")

        drawn_winners = list(db.execute(select(WinamWinner).where(WinamWinner.draw_week_id == week.id)).scalars())
        _assert(drawn_winners, "No winners generated")
        winner = drawn_winners[0]
        original_winner_state = {"is_flagged": winner.is_flagged}
        flag_winner(FlagWinnerPayload(admin_id=admin.id, winner_id=winner.id, flagged=True), db=db)
        flag_winner(FlagWinnerPayload(admin_id=admin.id, winner_id=winner.id, flagged=False), db=db)
        _restore_fields(winner, original_winner_state)
        db.commit()

        # KYC + payment for a winning player.
        kyc = db.execute(select(WinamKyc).where(WinamKyc.player_id == winner.player_id)).scalar_one_or_none()
        created_kyc = False
        if not kyc:
            submit_identity(db, winner.player_id, "Smoke", "Winner", "1990-01-01", "NIN", "SMOKE12345")
            submit_bank_details(db, winner.player_id, "000", "Smoke Bank", "1234567890", "Smoke Winner")
            created_kyc = True
            kyc = db.execute(select(WinamKyc).where(WinamKyc.player_id == winner.player_id)).scalar_one()
        original_kyc_state = {
            "verified": kyc.verified,
            "verified_at": kyc.verified_at,
            "verified_by": kyc.verified_by,
        }
        verify_kyc_route(VerifyKycPayload(admin_id=admin.id, player_id=winner.player_id), db=db)

        payment = (
            db.execute(
                select(WinamPayment)
                .where(WinamPayment.winner_id == winner.id)
                .order_by(WinamPayment.created_at.desc())
                .limit(1)
            ).scalar_one_or_none()
        )
        created_payment = False
        if not payment:
            created_payment = True
            created_payment_result = create_payment(
                PaymentCreatePayload(
                    admin_id=admin.id,
                    player_id=winner.player_id,
                    winner_id=winner.id,
                    draw_week_id=week.id,
                    amount_naira=int(winner.prize_amount),
                    prize_type=winner.prize_type,
                ),
                db=db,
            )
            payment = db.execute(select(WinamPayment).where(WinamPayment.id == created_payment_result["paymentId"])).scalar_one()
        original_payment_state = {
            "status": payment.status,
            "paid_at": payment.paid_at,
            "paid_by": payment.paid_by,
        }
        mark_paid(PaymentMarkPayload(admin_id=admin.id, payment_id=payment.id, player_id=winner.player_id), db=db)

        kyc_payload = admin_player_kyc_route(admin_id=admin.id, player_id=winner.player_id, db=db)
        _assert(kyc_payload["kyc"] is not None, "Player KYC endpoint failed")
        _assert(admin_player_payments_route(admin_id=admin.id, player_id=winner.player_id, db=db)["payments"] is not None, "Player payments endpoint failed")
        _assert(admin_draw_winners_route(admin_id=admin.id, draw_week_id=week.id, db=db)["winners"], "Draw winners endpoint failed")

        # Restore the side effects so the test stays repeatable.
        _restore_fields(kyc, original_kyc_state)
        db.commit()
        if created_kyc:
            _safe_delete(db, kyc)
        else:
            db.commit()

        _restore_fields(payment, original_payment_state)
        db.commit()
        if created_payment:
            _safe_delete(db, payment)
        else:
            db.commit()

        # Backend coverage summaries.
        winners_payload = list_winners(admin_id=admin.id, draw_week_id=week.id, db=db)
        _assert(winners_payload["winners"], "Winners endpoint returned no winners")

    # Admin route sanity checks through the web service.
    route_checks = {
        "/admin/login": "WinamGames Admin",
        "/admin": "Admin",
        "/admin/draw": "Draw",
        "/admin/players": "Players",
        "/admin/winners": "Winners",
        "/admin/banners": "Banners",
        "/admin/missions": "Missions",
        "/admin/config": "Config",
        "/admin/intelli": "Intelli",
    }
    for path, needle in route_checks.items():
        body = _fetch(path)
        _assert(needle.lower() in body.lower(), f"{path} did not contain expected text: {needle}")

    print("\nAdmin integration smoke test complete.")
    print("  backend routes: verified")
    print("  frontend admin routes: verified")


if __name__ == "__main__":
    main()
