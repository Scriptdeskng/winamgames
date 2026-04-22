

## Reframe rewards without naming a fixed amount

Two spots on the landing page hard-code "₦50,000". If the prize pool changes, the page lies. Replace both with framing that signals real cash + frequency + scale, without locking a number.

### Recommendation

**Keep the per-winner amounts in the Winners section** (₦35,000 / ₦10,000 / ₦5,000) — that's *evidence*, not a promise. Real past payouts are the strongest proof we have, and removing them would weaken the section more than the flexibility is worth.

**Drop the total pool number** in the two marketing spots (hero pill + social proof pill). The total is the brittle one — it's what changes when you add tiers or scale up.

### Edits to `src/routes/index.tsx`

**1. Social proof strip — line 534**

Remove the `₦50,000 in weekly prizes` pill. Replace with a frequency/scale framing that stays true regardless of pool size:

> `{ icon: Coins, label: "Real cash, every week" }`

Alternatives if you'd rather lean different directions:
- `"Cash + airtime, drawn weekly"` — broadens the reward type
- `"Weekly cash payouts"` — shortest, most direct
- `"New winners every Sunday"` — shifts focus from pot to people

Going with **"Real cash, every week"** — keeps the `Coins` icon meaningful, signals it's not points/tokens, and reinforces the weekly cadence already on the neighbouring pill.

**2. Hero prize pill — line 144**

Currently: `"₦50,000 in prizes drawn every Sunday"`

Replace with: `"Cash prizes drawn every Sunday"`

Keeps the `Trophy` icon, the gold `text-coin` styling, and the Sunday cadence — just drops the fixed number. Reads as a confident promise without committing to a figure.

### Why this works without an amount

The page still has three layers of credibility that do the heavy lifting:

1. **Winners section** shows actual ₦35K / ₦10K / ₦5K payouts with masked phones + entry hashes — concrete evidence beats an abstract pool number.
2. **"50+ winners every Sunday"** pill stays — communicates scale.
3. **"Real cash, every week"** + hero pill — communicates that prizes are cash, frequent, and reliable.

Together these say *"many people win real money often"* without a single hard number that can age out of date.

### Files touched

- `src/routes/index.tsx` — two single-line copy changes (lines 144 and 534).

### Out of scope

- Winners section per-row prize amounts — kept as evidence.
- Any backend / draw config changes.

