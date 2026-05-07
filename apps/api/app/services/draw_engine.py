from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LedgerRow:
    id: str
    player_id: str
    entries_delta: int


@dataclass(frozen=True)
class VirtualTicket:
    player_id: str
    ticket_id: str


@dataclass(frozen=True)
class CashTier:
    position: int
    amount_naira: int


@dataclass(frozen=True)
class AirtimeTier:
    count: int
    amount_naira: int


@dataclass(frozen=True)
class SelectedWinner:
    player_id: str
    ticket_id: str
    position: int
    prize_type: str
    prize_amount: int


def mulberry32(seed: int):
    a = seed & 0xFFFFFFFF

    def rand() -> float:
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return rand


def seed_from_hex(hex_seed: str) -> int:
    clean = "".join(ch for ch in hex_seed if ch.lower() in "0123456789abcdef")[:8] or "0"
    return int(clean, 16) & 0xFFFFFFFF


def expand_tickets(rows: list[LedgerRow], weekly_cap: int, excluded_player_ids: set[str]) -> list[VirtualTicket]:
    tickets: list[VirtualTicket] = []
    generated_by_player: dict[str, int] = {}

    for row in rows:
        if row.player_id in excluded_player_ids:
            continue
        if row.entries_delta <= 0:
            continue

        already_generated = generated_by_player.get(row.player_id, 0)
        remaining_for_player = weekly_cap - already_generated
        if remaining_for_player <= 0:
            continue

        count = min(row.entries_delta, remaining_for_player)
        compact = row.id.replace("-", "").upper()
        base = compact[:6]
        for ticket_index_within_row in range(count):
            suffix = str(ticket_index_within_row + 1).zfill(2)
            tickets.append(VirtualTicket(player_id=row.player_id, ticket_id=f"WG-{base}-{suffix}"))
        generated_by_player[row.player_id] = already_generated + count

    return tickets


def _shuffle_seeded(items, rand):
    arr = list(items)
    for i in range(len(arr) - 1, 0, -1):
        j = int(rand() * (i + 1))
        arr[i], arr[j] = arr[j], arr[i]
    return arr


def select_winners(
    tickets: list[VirtualTicket],
    seed_hex: str,
    cash_tiers: list[CashTier],
    airtime_tiers: list[AirtimeTier],
) -> list[SelectedWinner]:
    rand = mulberry32(seed_from_hex(seed_hex))
    shuffled = _shuffle_seeded(tickets, rand)
    seen: set[str] = set()
    queue: list[VirtualTicket] = []
    for ticket in shuffled:
        if ticket.player_id in seen:
            continue
        seen.add(ticket.player_id)
        queue.append(ticket)

    winners: list[SelectedWinner] = []
    position = 0

    for tier in sorted(cash_tiers, key=lambda t: t.position):
        ticket = queue.pop(0) if queue else None
        if not ticket:
            return winners
        position = tier.position
        winners.append(
            SelectedWinner(
                player_id=ticket.player_id,
                ticket_id=ticket.ticket_id,
                position=position,
                prize_type="cash",
                prize_amount=tier.amount_naira,
            )
        )

    for tier in airtime_tiers:
        for _ in range(tier.count):
            ticket = queue.pop(0) if queue else None
            if not ticket:
                return winners
            position += 1
            winners.append(
                SelectedWinner(
                    player_id=ticket.player_id,
                    ticket_id=ticket.ticket_id,
                    position=position,
                    prize_type="airtime",
                    prize_amount=tier.amount_naira,
                )
            )

    return winners
