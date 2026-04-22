// Draw state machine — derives the current phase of the weekly draw cycle
// from a Date in the user's clock, projected to West Africa Time (WAT, UTC+1).
//
// Schedule (WAT):
//   Mon 00:00          → week opens
//   Sun 19:00          → entries lock
//   Sun 20:00          → draw executes
//   Sun 20:15          → new week opens
export type DrawState = "open" | "locked" | "drawn" | "new_week";

export function getDrawState(now: Date): DrawState {
  // WAT is UTC+1, no DST. Shift the timestamp into "WAT clock" then read UTC fields.
  const watNow = new Date(now.getTime() + 60 * 60 * 1000);
  const day = watNow.getUTCDay(); // 0 = Sunday
  const timeInMinutes = watNow.getUTCHours() * 60 + watNow.getUTCMinutes();

  if (day === 0) {
    if (timeInMinutes < 19 * 60) return "open"; // before 19:00
    if (timeInMinutes < 20 * 60) return "locked"; // 19:00 – 20:00
    if (timeInMinutes < 20 * 60 + 15) return "drawn"; // 20:00 – 20:15
    return "new_week"; // 20:15 onwards
  }
  return "open";
}

// Next Sunday 19:00 WAT (= Sunday 18:00 UTC).
// If today is Sunday and we're already past 18:00 UTC, jump to the following Sunday.
export function getNextEntriesLockWAT(): Date {
  const now = new Date();
  const target = new Date(now);
  const dayUTC = now.getUTCDay();
  let daysUntil = (7 - dayUTC) % 7;
  target.setUTCHours(18, 0, 0, 0); // 19:00 WAT
  if (daysUntil === 0 && now.getTime() >= target.getTime()) {
    daysUntil = 7;
  }
  target.setUTCDate(now.getUTCDate() + daysUntil);
  target.setUTCHours(18, 0, 0, 0);
  return target;
}
