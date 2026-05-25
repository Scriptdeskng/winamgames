export type DrawState = "open" | "locked" | "drawn" | "new_week";

export function getDrawState(now: Date): DrawState {
  const watNow = new Date(now.getTime() + 60 * 60 * 1000);
  const day = watNow.getUTCDay();
  const timeInMinutes = watNow.getUTCHours() * 60 + watNow.getUTCMinutes();
  if (day === 0) {
    if (timeInMinutes < 19 * 60) return "open";
    if (timeInMinutes < 20 * 60) return "locked";
    if (timeInMinutes < 20 * 60 + 15) return "drawn";
    return "new_week";
  }
  return "open";
}

export function getNextEntriesLockWAT(): Date {
  const now = new Date();
  const target = new Date(now);
  const dayUTC = now.getUTCDay();
  let daysUntil = (7 - dayUTC) % 7;
  target.setUTCHours(18, 0, 0, 0);
  if (daysUntil === 0 && now.getTime() >= target.getTime()) daysUntil = 7;
  target.setUTCDate(now.getUTCDate() + daysUntil);
  target.setUTCHours(18, 0, 0, 0);
  return target;
}
