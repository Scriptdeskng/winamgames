from __future__ import annotations

import argparse
import json
import re
import os
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

import bcrypt
from sqlalchemy import text

from app.db.session import SessionLocal
from app.domain.enums import MissionConditionType, RewardType
from app.domain.models import (
    WinamAdminUser,
    WinamBanner,
    WinamCheckmatePuzzle,
    WinamMission,
    WinamPlatformConfig,
    WinamWisdomPuzzle,
)
from app.services.draws import get_or_create_current_draw_week


ROOT = Path(__file__).resolve().parents[1]
SEED_DATA_DIR = ROOT / "seed-data"
LEGACY_SEED_DATA_DIR = ROOT.parent.parent / "src" / "data"
PUZZLE_EXPORT_PATH = ROOT / "winam_puzzles_prod_export.sql"

def _stable_uuid(name: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"winam:{name}"))


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _parse_ts_objects(path: Path, export_name: str) -> list[dict[str, str]]:
    text = path.read_text(encoding="utf-8")
    marker = f"export const {export_name}"
    start = text.index(marker)
    start = text.index("=", start)
    start = text.index("[", start)

    objects: list[str] = []
    brace_depth = 0
    current: list[str] = []
    in_string = False
    quote_char = ""
    escaped = False

    for ch in text[start:]:
        if in_string:
            current.append(ch)
            if escaped:
                escaped = False
                continue
            if ch == "\\":
                escaped = True
                continue
            if ch == quote_char:
                in_string = False
            continue

        if ch in {"'", '"'}:
            in_string = True
            quote_char = ch
            current.append(ch)
            continue

        if ch == "{":
            brace_depth += 1
            current.append(ch)
            continue
        if ch == "}":
            brace_depth -= 1
            current.append(ch)
            if brace_depth == 0:
                objects.append("".join(current))
                current = []
            continue

        if brace_depth > 0:
            current.append(ch)

        if ch == "]" and brace_depth == 0:
            break

    parsed: list[dict[str, str]] = []
    for obj in objects:
        parsed.append(_parse_ts_object(obj))
    return parsed


def _parse_ts_object(raw: str) -> dict[str, str]:
    cleaned = raw.strip().rstrip(",")
    result: dict[str, str] = {}
    for key in ("id", "fen", "solutionMove", "hintPiece", "hintDestination", "theme", "proverb", "origin"):
        m = re.search(rf"{key}:\s*\"([^\"]*)\"", cleaned)
        if m:
            result[key] = m.group(1)
    for key in ("difficulty", "correctIndex"):
        m = re.search(rf"{key}:\s*(\d+)", cleaned)
        if m:
            result[key] = m.group(1)
    m = re.search(r"options:\s*\[(.*?)\]", cleaned, re.S)
    if m:
        result["options"] = json.dumps(re.findall(r"\"([^\"]*)\"", m.group(1)))
    return result


def _upsert_platform_config(db) -> None:
    configs = {
        "weekly_cap": 50,
        "prize_cash_tiers": [
            {"position": 1, "amount_naira": 35000},
            {"position": 2, "amount_naira": 10000},
            {"position": 3, "amount_naira": 5000},
        ],
        "prize_airtime_tiers": [
            {"count": 75, "amount_naira": 200},
        ],
    }
    for key, value in configs.items():
        db.merge(WinamPlatformConfig(key=key, value=value, updated_by="seed"))


def _seed_admin_user(db) -> None:
    admin_email = os.getenv("WINAM_SEED_ADMIN_EMAIL", "admin@winam.games")
    admin_password = os.getenv("WINAM_SEED_ADMIN_PASSWORD", "Admin123!")
    admin_id = _stable_uuid("admin-user")
    existing = db.get(WinamAdminUser, admin_id)
    if not existing:
        existing = db.query(WinamAdminUser).filter(WinamAdminUser.email == admin_email).one_or_none()
    if existing:
        existing.id = admin_id
        existing.email = admin_email
        existing.password_hash = _hash_password(admin_password)
        existing.role = "admin"
        db.flush()
        return
    db.add(
        WinamAdminUser(
            id=admin_id,
            email=admin_email,
            password_hash=_hash_password(admin_password),
            role="admin",
        )
    )


def _seed_banners(db) -> None:
    banners = [
        {
            "id": _stable_uuid("banner-1"),
            "title": "Winam Weekly Draw",
            "subtitle": "Play daily to earn more tickets.",
            "icon_url": None,
            "display_order": 0,
            "is_active": True,
        },
        {
            "id": _stable_uuid("banner-2"),
            "title": "CheckMate Challenge",
            "subtitle": "Solve puzzles and stack entries.",
            "icon_url": None,
            "display_order": 1,
            "is_active": True,
        },
        {
            "id": _stable_uuid("banner-3"),
            "title": "WisdomDrop Daily",
            "subtitle": "Keep the streak going for bonus rewards.",
            "icon_url": None,
            "display_order": 2,
            "is_active": True,
        },
    ]
    for payload in banners:
        db.merge(WinamBanner(**payload))


def _seed_missions(db) -> None:
    missions = [
        {
            "id": _stable_uuid("mission-1"),
            "title": "Solve 10 puzzles",
            "condition_type": MissionConditionType.puzzles_solved,
            "condition_value": 10,
            "reward_type": RewardType.entries,
            "reward_amount": 5,
            "game_type": None,
            "is_active": True,
        },
        {
            "id": _stable_uuid("mission-2"),
            "title": "Finish a no-hint run",
            "condition_type": MissionConditionType.no_hints,
            "condition_value": 1,
            "reward_type": RewardType.entries,
            "reward_amount": 3,
            "game_type": None,
            "is_active": True,
        },
        {
            "id": _stable_uuid("mission-3"),
            "title": "Play both game types",
            "condition_type": MissionConditionType.game_type_mix,
            "condition_value": 2,
            "reward_type": RewardType.entries,
            "reward_amount": 8,
            "game_type": None,
            "is_active": True,
        },
        {
            "id": _stable_uuid("mission-4"),
            "title": "Keep a 3-day streak",
            "condition_type": MissionConditionType.streak_day,
            "condition_value": 3,
            "reward_type": RewardType.coins,
            "reward_amount": 250,
            "game_type": None,
            "is_active": True,
        },
    ]
    for payload in missions:
        db.merge(WinamMission(**payload))


def _seed_draw_week(db) -> None:
    get_or_create_current_draw_week(db)


def _seed_puzzles_from_export(db, export_path: Path) -> None:
    db.execute(
        text(
            "TRUNCATE TABLE winam_checkmate_puzzles, winam_wisdom_puzzles "
            "RESTART IDENTITY CASCADE"
        )
    )

    lines = export_path.read_text(encoding="utf-8").splitlines(keepends=True)
    copy_tables = {
        "COPY public.winam_checkmate_puzzles (id, fen, solution_move, theme, difficulty, rating, hint_piece, hint_destination, times_served, created_at, opponent_from, opponent_to) FROM stdin;",
        "COPY public.winam_wisdom_puzzles (id, region, display_text, blank, options, correct_index, original_proverb, difficulty, explanation, created_at) FROM stdin;",
    }

    raw_connection = db.connection().connection
    with raw_connection.cursor() as cursor:
        idx = 0
        while idx < len(lines):
            line = lines[idx]
            stripped = line.strip()
            if stripped in copy_tables:
                copy_sql = stripped[:-1] if stripped.endswith(";") else stripped
                with cursor.copy(copy_sql) as copy:
                    idx += 1
                    while idx < len(lines):
                        data_line = lines[idx]
                        if data_line.strip() == r"\.":
                            break
                        copy.write(data_line.encode("utf-8"))
                        idx += 1
                while idx < len(lines) and lines[idx].strip() != r"\.":
                    idx += 1
                idx += 1
                continue
            idx += 1


def _seed_puzzles(db) -> None:
    if PUZZLE_EXPORT_PATH.exists():
        _seed_puzzles_from_export(db, PUZZLE_EXPORT_PATH)
        return

    data_dir = SEED_DATA_DIR if SEED_DATA_DIR.exists() else LEGACY_SEED_DATA_DIR
    checkmate_path = data_dir / "checkmate-puzzles.ts"
    wisdom_path = data_dir / "wisdomdrop-puzzles.ts"

    checkmate_rows = _parse_ts_objects(checkmate_path, "CHECKMATE_PUZZLES")
    wisdom_rows = _parse_ts_objects(wisdom_path, "WISDOMDROP_PUZZLES")

    for row in checkmate_rows:
        payload = {
            "fen": row["fen"],
            "solution_move": row["solutionMove"],
            "theme": row["theme"],
            "difficulty": int(row["difficulty"]),
            "rating": 1600 + int(row["difficulty"]) * 100,
            "hint_piece": row.get("hintPiece"),
            "hint_destination": row.get("hintDestination"),
        }
        existing = db.get(WinamCheckmatePuzzle, row["id"])
        if existing:
            for key, value in payload.items():
                setattr(existing, key, value)
        else:
            db.add(WinamCheckmatePuzzle(id=row["id"], **payload))

    for row in wisdom_rows:
        options = json.loads(row["options"])
        difficulty = int(row["difficulty"])
        payload = {
            "display_text": row["proverb"],
            "original_proverb": row["proverb"].replace("___", " ").replace("  ", " ").strip(),
            "blank": "___",
            "region": row["origin"],
            "difficulty": {1: "beginner", 2: "intermediate", 3: "advanced"}.get(difficulty, "beginner"),
            "options": options,
            "correct_index": int(row["correctIndex"]),
            "explanation": None,
        }
        existing = db.get(WinamWisdomPuzzle, row["id"])
        if existing:
            for key, value in payload.items():
                setattr(existing, key, value)
        else:
            db.add(WinamWisdomPuzzle(id=row["id"], **payload))


def seed_database() -> None:
    db = SessionLocal()
    try:
        _seed_admin_user(db)
        _upsert_platform_config(db)
        _seed_banners(db)
        _seed_missions(db)
        _seed_draw_week(db)
        _seed_puzzles(db)
        db.commit()
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Winam local database.")
    parser.add_argument("--reset", action="store_true", help="Clear selected tables before seeding.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.reset:
            for model in (
                WinamWisdomPuzzle,
                WinamCheckmatePuzzle,
                WinamMission,
                WinamBanner,
                WinamPlatformConfig,
            ):
                db.query(model).delete()
            db.commit()
        _seed_admin_user(db)
        _upsert_platform_config(db)
        _seed_banners(db)
        _seed_missions(db)
        _seed_draw_week(db)
        _seed_puzzles(db)
        db.commit()
        print("Seed complete.")
        print(
            "Admin login: "
            f"{os.getenv('WINAM_SEED_ADMIN_EMAIL', 'admin@winam.games')} / "
            f"{os.getenv('WINAM_SEED_ADMIN_PASSWORD', 'Admin123!')}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
