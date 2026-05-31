# Constant Menu + Daily Lunch Menu — Design

Date: 2026-05-31

## Goal
Split the bakery menu into two tiers:
- **Constant menu** — the bakery's permanent offerings. Stays the same; edited rarely.
- **Daily lunch menu** — a special lunch menu the owner updates day to day.

On the public site they appear as **one page, two sections**: the Daily Lunch shows as a
highlighted section nested within the main menu page. Customers add items from both into a
**single cart / single order** (one Booking ID).

## Decisions
- Daily lunch is updated via the existing **OCR photo → edit → publish** flow.
- Constant menu supports **both OCR photo and manual editing** (OCR to bulk-load, manual for tweaks).
- Daily lunch **carries over**: yesterday's published lunch menu stays visible until the owner
  publishes a new one. Never shows an empty lunch section because the owner forgot.
- One unified cart: constant + lunch items ordered together.

## Data Model
Reuse the existing `menus` / `menu_items` tables. Minimal change:

```sql
ALTER TABLE menus ADD COLUMN type TEXT NOT NULL DEFAULT 'daily_lunch';
ALTER TABLE menus ALTER COLUMN date DROP NOT NULL;
-- Seed the single permanent constant menu row:
INSERT INTO menus (type, date, published) VALUES ('constant', NULL, TRUE);
```

- **Constant menu** = exactly one row: `type='constant'`, `date=NULL`, `published=TRUE`.
- **Daily lunch menu** = one row per date, `type='daily_lunch'` (existing rows default to this).
- `menu_items` unchanged — each item belongs to whichever `menu_id`.

RLS: existing "viewable if published" policies still apply to both types.

## Public Menu Page (`menu/index.html` + `menu/js/menu.js`)
Two fetches replace the single fetch:
1. **Constant menu** — `menus` where `type='constant'` and `published=true`, with `menu_items(*)`.
2. **Daily lunch** — `menus` where `type='daily_lunch'` and `published=true`, ordered by
   `date DESC`, limit 1 → most recent (carry-over behavior).

Render two sections:
- **Main menu** section (constant items, grouped by category as today).
- **Daily Lunch** section — visually highlighted, nested within the page, with the lunch
  date label (`formatDateCanada`). If no daily lunch row exists at all, the lunch section is
  hidden (not an error). Constant section renders independently.

Both sections' add-to-cart buttons call `window.addToCart(...)` exactly as now → unified cart.
Existing realtime subscription on `menus` + `menu_items` stays; refetches both on change.

## Admin Panel
- **Daily lunch:** existing `admin/menu-upload.html` photo→OCR→edit→publish flow, publishing with
  `type:'daily_lunch'` and the current date.
- **Constant menu:** an admin editor that publishes to the single constant row. Supports:
  - OCR photo bulk-load (reuse `/api/scan-menu` + the editable item cards), and
  - Manual add/edit/delete of item rows (name, price, category).
  Publishes with `type:'constant'` (no date).

## Server (`server.js` -> `/api/publish-menu`)
Accept an optional `type` field (default `'daily_lunch'`).
- For `type='daily_lunch'`: unchanged — resolve/create the row by `date`.
- For `type='constant'`: resolve the single constant row by `type='constant'` (date is NULL),
  set `published=true`; create it if missing. Item delete-and-replace logic is unchanged.

`/api/scan-menu` and `/api/update-order-status` are untouched.

## Out of Scope
- No change to checkout, Booking ID, feedback, or order flows.
- No per-item images, scheduling, or multiple lunch menus per day.

## Success Criteria
- Public menu page shows a constant section plus a nested, highlighted Daily Lunch section.
- Owner updates the daily lunch by photographing it; it goes live within ~2s, carrying over until replaced.
- Owner can populate/edit the constant menu via photo or manual entry; it stays put across days.
- Items from both sections add to one cart and one order.
- Existing pages and flows remain unbroken.
