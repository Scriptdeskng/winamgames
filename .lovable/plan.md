
# Winners Page — Phone Format & Entry ID Display Fix

## Changes needed

### 1. Phone number format
Change from `***8231` to `080*****31` format (showing first 3 and last 2 digits with middle asterisked).

Nigerian phone format: typically 11 digits starting with `080`, `081`, `070`, `090`, `091` etc.
Pattern: `ABC*****XY` where ABC = first 3 digits, XY = last 2 digits, middle = 6 asterisks

### 2. Entry ID display
Currently only cash winners show entry IDs. Need to add entry IDs to ALL airtime winners as well.

## Implementation

**File: `src/routes/_authed/winners.tsx`**

1. Update all hardcoded phone numbers in `DRAW_WEEKS` data to use format `080*****31`, `081*****42`, etc.
2. Modify `AirtimeSection` component to display entry IDs for all airtime winners (lines 150-154)
   - Add entry ID display below or next to phone number
   - Use same styling as cash winners: `text-[9px] text-muted-foreground tabular-nums` with `Hash` icon
3. Update phone generation logic for ₦500 tier (lines 70-72, 114-116) to produce realistic Nigerian numbers

Example airtime winner row (new layout):
```
080*****31  #D4E7F1A3  ₦2,000
```

Or stacked for better mobile fit:
```
080*****31
#D4E7F1A3         ₦2,000
```
