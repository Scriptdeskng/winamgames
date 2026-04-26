// Pure deterministic draw engine — no DB, no IO.
// Used by executeDrawWeek to select winners from the weekly ticket pool.

export interface LedgerRow {
  id: string;
  player_id: string;
  entries_delta: number;
}

export interface VirtualTicket {
  playerId: string;
  ticketId: string;
}

export interface CashTier {
  position: number;
  amount_naira: number;
}

export interface AirtimeTier {
  count: number;
  amount_naira: number;
}

export interface SelectedWinner {
  playerId: string;
  ticketId: string;
  position: number;
  prizeType: "cash" | "airtime";
  prizeAmount: number;
}

// Mulberry32 — small, fast, deterministic 32-bit PRNG.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromHex(hex: string): number {
  // Take first 8 hex chars → uint32. Strip non-hex chars defensively.
  const clean = hex.replace(/[^0-9a-f]/gi, "").slice(0, 8) || "0";
  return parseInt(clean, 16) >>> 0;
}

// Expand ledger rows into virtual tickets, matching the player-facing ticket ID format.
export function expandTickets(
  rows: LedgerRow[],
  weeklyCap: number,
  excludedPlayerIds: Set<string>
): VirtualTicket[] {
  const tickets: VirtualTicket[] = [];
  const generatedByPlayer = new Map<string, number>();

  for (const row of rows) {
    if (excludedPlayerIds.has(row.player_id)) continue;
    if (row.entries_delta <= 0) continue;

    const alreadyGenerated = generatedByPlayer.get(row.player_id) ?? 0;
    const remainingForPlayer = weeklyCap - alreadyGenerated;
    if (remainingForPlayer <= 0) continue;

    const count = Math.min(row.entries_delta, remainingForPlayer);
    const compact = row.id.replace(/-/g, "").toUpperCase();
    const base = compact.slice(0, 6);

    for (let ticketIndexWithinRow = 0; ticketIndexWithinRow < count; ticketIndexWithinRow++) {
      const suffix = String(ticketIndexWithinRow + 1).padStart(2, "0");
      tickets.push({
        playerId: row.player_id,
        ticketId: `WG-${base}-${suffix}`,
      });
    }

    generatedByPlayer.set(row.player_id, alreadyGenerated + count);
  }
  return tickets;
}

// Fisher–Yates shuffle in-place using a seeded PRNG.
function shuffleSeeded<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Select winners: shuffle ticket pool, walk through it picking unique players,
// assign to cash tiers first then airtime tiers.
export function selectWinners(
  tickets: VirtualTicket[],
  seedHex: string,
  cashTiers: CashTier[],
  airtimeTiers: AirtimeTier[]
): SelectedWinner[] {
  const rand = mulberry32(seedFromHex(seedHex));
  const shuffled = shuffleSeeded(tickets, rand);
  const seen = new Set<string>();
  const queue: VirtualTicket[] = [];
  for (const t of shuffled) {
    if (seen.has(t.playerId)) continue;
    seen.add(t.playerId);
    queue.push(t);
  }

  const winners: SelectedWinner[] = [];
  let position = 0;

  // Cash tiers — by explicit position
  const sortedCash = cashTiers.slice().sort((a, b) => a.position - b.position);
  for (const tier of sortedCash) {
    const t = queue.shift();
    if (!t) return winners;
    position = tier.position;
    winners.push({
      playerId: t.playerId,
      ticketId: t.ticketId,
      position,
      prizeType: "cash",
      prizeAmount: tier.amount_naira,
    });
  }

  // Airtime tiers — sequential after cash
  for (const tier of airtimeTiers) {
    for (let i = 0; i < tier.count; i++) {
      const t = queue.shift();
      if (!t) return winners;
      position += 1;
      winners.push({
        playerId: t.playerId,
        ticketId: t.ticketId,
        position,
        prizeType: "airtime",
        prizeAmount: tier.amount_naira,
      });
    }
  }

  return winners;
}
