from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.admin_auth import verify_admin_session
from app.services.session_tokens import ADMIN_SESSION_COOKIE, require_session_subject

router = APIRouter()


def _assert_admin(request: Request, db: Session, admin_id: str) -> None:
    require_session_subject(
        request,
        cookie_name=ADMIN_SESSION_COOKIE,
        expected_kind="admin",
        provided_subject=admin_id,
    )
    if not verify_admin_session(db, admin_id).get("valid"):
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Unauthorized")


HELP_ARTICLES: list[dict[str, object]] = [
    {
        "id": "draw",
        "label": "Weekly draw",
        "intro": "The WinamGames weekly draw runs every Sunday. The draw is fully automated — no admin action is required for a normal draw cycle.",
        "blocks": [
            {
                "type": "table",
                "title": "1. Draw schedule",
                "headers": ["Time (WAT)", "Event", "Trigger", "Admin action"],
                "rows": [
                    ["Mon 00:00", "New draw week opens", "Auto — first player session", "None"],
                    ["Sun 19:50", "Entry lock", "Auto — first player session after 19:50", "None"],
                    ["Sun 20:00", "Draw execution", "Auto — first player session after 20:00", "None"],
                    ["Sun 20:00", "Winners published", "Auto — immediately after execution", "None"],
                    ["Sun 20:00", "Week settled", "Auto — immediately after publish", "None"],
                ],
                "warning": "The automation triggers on player sessions — not a server cron. If no player opens the app after 19:50 or 20:00 WAT, automation will not fire until someone does.",
            },
            {
                "type": "steps",
                "title": "2. Normal Sunday flow — no action required",
                "steps": [
                    "Players earn tickets throughout the week (Mon–Sun).",
                    "At 19:50 WAT — first player session triggers auto-lock. Ticket earning stops. Coins and XP still awarded.",
                    "At 20:00 WAT — first player session triggers auto-execute. Winners selected from ticket pool.",
                    "Winners automatically published — player app shows winners immediately.",
                    "Week automatically settled — new draw week opens on next session.",
                ],
            },
            {
                "type": "grid",
                "title": "3. Manual override — when automation fails",
                "warning": "Only intervene manually if automation has clearly failed. Check the draw status in /admin/draw first.",
                "items": [
                    {
                        "title": "Lock",
                        "steps": [
                            "Go to Draw management.",
                            "Click Lock.",
                            "Confirm the action.",
                            "Status changes to Locked.",
                        ],
                    },
                    {
                        "title": "Execute",
                        "steps": [
                            "Click Execute.",
                            "Type EXECUTE DRAW to confirm.",
                            "Confirm the action.",
                        ],
                    },
                    {
                        "title": "Publish",
                        "steps": [
                            "Find the drawn week in History.",
                            "Click Publish.",
                            "Confirm winners become visible to players.",
                        ],
                    },
                    {
                        "title": "Settle",
                        "steps": [
                            "Click Settle.",
                            "Confirm the action.",
                            "Status changes to Settled.",
                        ],
                    },
                ],
            },
            {
                "type": "grid",
                "title": "4. Quick reference",
                "items": [
                    {
                        "title": "Draw schedule",
                        "list": ["Lock: Sunday 19:50 WAT", "Execute: Sunday 20:00 WAT", "New week: Monday 00:00 WAT"],
                    },
                    {
                        "title": "Prize tiers",
                        "list": ["1st place: ₦35,000 cash", "2nd place: ₦10,000 cash", "3rd place: ₦5,000 cash", "4th–78th: ₦200 airtime"],
                    },
                ],
            },
        ],
    },
    {
        "id": "config",
        "label": "Platform config",
        "intro": "Reference for every platform config key. Edit values at /admin/config. Changes take effect on the next read — past sessions are not recalculated.",
        "warning": "Always double-check values before saving. There is no undo — incorrect values affect all active players immediately.",
        "blocks": [
            {
                "type": "section",
                "title": "Economy",
                "rows": [
                    {"name": "weekly_cap", "type": "Integer", "description": "Maximum tickets a player can earn in one draw week. Once reached, puzzle completions still award coins and XP but no further tickets are added.", "default": "50"},
                    {"name": "hint_penalty", "type": "Decimal multiplier", "description": "Multiplier applied to ticket earnings when a player uses hints. 1 = no penalty. 0.5 = half tickets when hints used. 0 = no tickets at all if any hint is used.", "default": "1"},
                    {"name": "base_N", "type": "Integer", "description": "Tickets awarded per N puzzles solved in a session. base_1 = tickets for 1 puzzle solved, base_5 = for 5 puzzles, and so on. Higher tiers reward longer sessions. N is determined by the key suffix.", "default": "5"},
                ],
            },
            {
                "type": "section",
                "title": "Pricing",
                "rows": [
                    {"name": "plan_daily_price", "type": "Integer (Naira)", "description": "Price in Naira for a daily subscription. Displayed on the renewal screen. Must match the amount configured in the Forthsoft billing SKU.", "default": "150"},
                    {"name": "plan_weekly_price", "type": "Integer (Naira)", "description": "Price in Naira for a weekly subscription. Displayed on the renewal screen. Must match the Forthsoft billing SKU amount.", "default": "300"},
                    {"name": "plan_daily_sku", "type": "String", "description": "Forthsoft billing identifier for the daily plan. Used by the CTO-managed billing webhook to match incoming payment events to the correct subscription plan.", "default": "daily"},
                    {"name": "plan_weekly_sku", "type": "String", "description": "Forthsoft billing identifier for the weekly plan. Same purpose as plan_daily_sku but for weekly subscribers.", "default": "weekly"},
                ],
            },
            {
                "type": "section",
                "title": "Draw",
                "rows": [
                    {"name": "prize_cash_tiers", "type": "JSON array", "description": "Defines cash prize positions and amounts in Naira. Each entry specifies a position and prize_amount. Edit carefully — this controls actual prize payouts.", "default": "See current value in config"},
                    {"name": "prize_airtime_tiers", "type": "JSON array", "description": "Defines airtime prize tiers. Each entry specifies count (number of winners at this tier) and amount (airtime value in Naira per winner).", "default": "See current value in config"},
                    {"name": "winners_published_week_id", "type": "UUID", "description": "The draw week ID currently shown on the public winners screen. Set automatically when you click Publish in Draw management. Only change manually if the wrong week is displaying.", "default": "—"},
                ],
            },
            {
                "type": "section",
                "title": "Game",
                "rows": [
                    {"name": "puzzle_weight_checkmate", "type": "Decimal", "description": "Relative selection weight for CheckMate puzzles. Higher value means CheckMate is shown more often relative to WisdomDrop.", "default": "1.0"},
                    {"name": "puzzle_weight_wisdomdrop", "type": "Decimal", "description": "Relative selection weight for WisdomDrop puzzles. Adjust the ratio between the two weights to control game mix.", "default": "1.0"},
                    {"name": "free_session_mode", "type": "JSON object", "description": "Controls free play mode for non-subscribers. enabled: whether non-subscribers can play at all. sessions_per_day: maximum free sessions allowed per day. earns_tickets: whether free sessions award draw tickets toward the weekly draw.", "default": '{"enabled": false, "sessions_per_day": 1, "earns_tickets": false}'},
                ],
            },
        ],
    },
    {
        "id": "content",
        "label": "Content",
        "intro": "The Content page (/admin/content) manages three types of player-facing content: banners, announcements and support FAQs.",
        "blocks": [
            {
                "type": "section",
                "title": "Banners",
                "text": "Banners appear in the stacked card strip on the player home screen. Up to 3 active banners rotate automatically every 5 seconds.",
                "grid": [
                    {"title": "Creating a banner", "steps": ["Go to Content → Banners tab.", "Click New banner.", "Enter a title (max 30 chars) and body (max 80 chars).", "Set sort order — lower numbers appear first.", "Toggle Active to publish immediately."]},
                    {"title": "Limits", "list": ["Title: 30 characters maximum", "Body: 80 characters maximum", "Only active banners display — drafts are hidden", "Sort order controls display sequence"]},
                ],
            },
            {
                "type": "section",
                "title": "Announcements",
                "text": "Announcements are full-screen image modals that appear when a player opens the home screen. Only one announcement can be active at a time.",
                "info": "Use announcements for time-sensitive promotions, prize notifications or new feature launches. Keep the image clear and the CTA specific.",
                "grid": [
                    {"title": "Every login", "text": "Shows every time the player opens the app. Use sparingly — overuse leads to dismissal without reading."},
                    {"title": "Once per week", "text": "Shows once per 7-day period per device. Good for weekly promotions."},
                    {"title": "Once only", "text": "Shows once per device and never again. Best for one-time announcements like a new game launch."},
                ],
            },
            {
                "type": "section",
                "title": "Support FAQs",
                "text": "FAQs appear on the player support page (/support). Use the reorder arrows to control display sequence. Only active FAQs are shown to players. Draft FAQs are hidden.",
            },
        ],
    },
    {
        "id": "players",
        "label": "Players",
        "intro": "The Players page (/admin/players) lists all registered players. Use it to investigate accounts, adjust balances and manage flags.",
        "blocks": [
            {"type": "section", "title": "Searching", "text": "Search by nickname using the search box. Results are paginated at 25 per page. Phone numbers are not searchable — use the player ID if you have it."},
            {
                "type": "section",
                "title": "Player actions",
                "grid": [
                    {"title": "Flag / unflag", "text": "Flagging marks a player as suspicious. Flagged players are highlighted in red on the players list and winners screen. Flagging does not restrict access — it is a moderation signal only. Always provide a reason for the audit log."},
                    {"title": "Adjust coins", "text": "Add or deduct coins from a player's balance. Use a negative number to deduct. This affects the player's spendable coin balance immediately. Provide a reason — this is logged."},
                    {"title": "Adjust XP", "text": "Add or deduct XP. XP determines a player's rank tier. Adjusting XP may change the player's visible rank. Provide a reason."},
                    {"title": "Player detail", "text": "Click View on any player to see their full profile — sessions, tickets, KYC status, mission progress and payment history."},
                ],
            },
            {"type": "warning", "text": "Coin and XP adjustments are immediate and cannot be undone from the admin panel. Always confirm the player ID before submitting."},
        ],
    },
    {
        "id": "winners",
        "label": "Winners",
        "intro": "The Winners page (/admin/winners) shows all drawn and settled weeks. Use it to manage KYC verification and mark cash prizes as paid.",
        "blocks": [
            {
                "type": "section",
                "title": "KYC verification flow",
                "steps": [
                    "Player wins a cash prize and sees a claim banner in the app.",
                    "Player completes KYC — submits identity details and bank account.",
                    "KYC status in admin changes to Complete.",
                    "Admin reviews submitted details and clicks the verify button (green tick icon).",
                    "Status changes to Verified.",
                    "Admin confirms the actual bank transfer has been made.",
                    "Admin clicks the mark paid button (card icon) to record payment.",
                    "Status changes to Paid.",
                ],
                "warning": "Do not mark as paid until the actual bank transfer is confirmed. This action is recorded but cannot be automatically reversed.",
            },
            {"type": "section", "title": "Flagging winners", "text": "Use the flag button on any winner row to mark a disputed entry. Flagged rows are highlighted in red. Flagging does not cancel the prize — contact your CTO to action any prize cancellation."},
            {"type": "section", "title": "CSV export", "text": "Expand any week and click CSV to download a full winner export. The file includes position, prize type, prize amount, player ID, nickname, phone last 4, payment status and KYC status."},
        ],
    },
    {
        "id": "missions",
        "label": "Missions",
        "intro": "Missions are challenges that reward players with coins or draw tickets. They are managed at /admin/missions.",
        "blocks": [
            {
                "type": "section",
                "title": "Condition types",
                "rows": [
                    {"name": "puzzles_solved", "type": "Count", "description": "Player must solve N puzzles in total. condition_target sets N. Counts across sessions — not within a single session unless combined with game_type_mix.", "default": "—"},
                    {"name": "no_hints", "type": "Count", "description": "Player must solve N puzzles without using any hints. Each hint-free puzzle increments progress by 1.", "default": "—"},
                    {"name": "streak_day", "type": "Days", "description": "Player must maintain a daily streak of N days. condition_target sets the required streak length.", "default": "—"},
                    {"name": "game_type_mix", "type": "Count", "description": "Player must play both CheckMate and WisdomDrop. condition_target sets the number of sessions of each type required.", "default": "—"},
                ],
            },
            {
                "type": "section",
                "title": "Reward types",
                "rows": [
                    {"name": "coins", "type": "Integer", "description": "Awards the player a fixed number of coins on completion. Coins are spendable on hints.", "default": "—"},
                    {"name": "entries", "type": "Integer", "description": "Awards the player a fixed number of draw tickets on completion. These count toward the weekly cap.", "default": "—"},
                ],
            },
            {
                "type": "section",
                "title": "Important notes",
                "info": "Changes to missions apply on the next session start. Existing player progress is not reset — a player halfway through a mission continues from where they were.",
                "grid": [
                    {"title": "Game type field", "text": "Leave game type as Any to apply the mission to both games. Set to CheckMate or WisdomDrop to restrict it to one game only."},
                    {"title": "Repeatable missions", "text": "Repeatable missions reset after completion and can be earned multiple times. Non-repeatable missions are completed once and never awarded again."},
                ],
            },
        ],
    },
]


@router.get("/help")
def help_content(admin_id: str, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    _assert_admin(request, db, admin_id)
    return {"articles": HELP_ARTICLES}
