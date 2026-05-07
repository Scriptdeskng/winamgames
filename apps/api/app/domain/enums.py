from enum import Enum


class DrawWeekStatus(str, Enum):
    open = "open"
    locked = "locked"
    drawn = "drawn"
    settled = "settled"


class EntrySourceType(str, Enum):
    game_session = "game_session"
    mission = "mission"
    streak_bonus = "streak_bonus"
    streak = "streak"


class GameType(str, Enum):
    checkmate = "checkmate"
    wisdomdrop = "wisdomdrop"


class MissionConditionType(str, Enum):
    puzzles_solved = "puzzles_solved"
    no_hints = "no_hints"
    streak_day = "streak_day"
    game_type_mix = "game_type_mix"


class MissionStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    expired = "expired"


class PuzzleResult(str, Enum):
    correct = "correct"
    incorrect = "incorrect"
    hint_used = "hint_used"
    timeout = "timeout"


class RankTier(str, Enum):
    starter = "starter"
    recruit = "recruit"
    sergeant = "sergeant"
    veteran = "veteran"
    champion = "champion"
    icon = "icon"
    legend = "legend"
    immortal = "immortal"


class RewardType(str, Enum):
    coins = "coins"
    entries = "entries"


class SubscriptionPlan(str, Enum):
    daily = "daily"
    weekly = "weekly"


class SubscriptionStatus(str, Enum):
    active = "active"
    grace = "grace"
    expired = "expired"
    cancelled = "cancelled"

