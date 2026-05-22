# Bakery by the Bay — Final Build Plan

## What We Are Building
A beautiful, fast bakery website with two core systems:

1. **Daily Menu System** — Owner takes a photo of today's menu →
   AI reads it → menu goes live on the website in real time.

2. **Pre-Order System** — Customer browses menu → adds items to cart →
   enters name + phone only → gets a Booking ID receipt →
   walks in and pays physically at the counter.

No Shopify. No Webflow. No complex framework unless the cloned repo
already uses one. No online payments. No customer account creation.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Vanilla HTML + CSS + JS | Match cloned site exactly |
| Backend/DB | Supabase (Postgres + Auth + Realtime) | Already set up |
| Vision OCR | OpenRouter API (free vision models) | One key, multiple models |
| Proxy Server | Node.js + Express | Keep API keys off browser |
| Deployment | Vercel | Free, simple, auto-deploy from GitHub |

---

## Credentials
OPENROUTER_API_KEY = [REDACTED]
SUPABASE_URL       = [REDACTED]
SUPABASE_ANON_KEY  = [REDACTED]
SUPABASE_SERVICE_KEY = [REDACTED]
OWNER_EMAIL        = [REDACTED]
OWNER_PASSWORD     = [REDACTED]

---

## Database Schema (Supabase)

4 tables only. Nothing more.
menus        — one row per day (menu_id, date, published, updated_at)
menu_items   — items belonging to a menu (name, price, category, available)
orders       — customer pre-orders (booking_id, name, phone, items JSONB, total, status)
feedback     — customer feedback form submissions

Realtime enabled on all 4 tables.
RLS: public can read published menus, public can insert orders + feedback.
Service role key used only in server-side proxy — never in browser.

---

## File Structure
/
├── .env                          ← all secrets, gitignored
├── .gitignore
├── vercel.json                   ← Vercel deployment config
├── package.json
├── server.js                     ← Express proxy (API key guard)
│
├── js/
│   └── supabase-client.js        ← shared Supabase client (anon key)
│
├── admin/
│   ├── index.html                ← owner login
│   ├── dashboard.html            ← live orders + feedback table
│   ├── menu-upload.html          ← camera → OCR → edit → publish
│   └── js/
│       ├── admin-auth.js
│       ├── camera.js
│       ├── ocr.js
│       └── menu-editor.js
│
├── menu/
│   ├── index.html                ← public menu page + cart drawer
│   └── js/
│       ├── menu.js               ← load + realtime subscription
│       └── cart.js               ← cart state in sessionStorage
│
├── order/
│   ├── checkout.html             ← name + phone + place order
│   ├── confirmation.html         ← booking ID receipt page
│   └── js/
│       ├── checkout.js
│       └── confirmation.js
│
└── feedback/
├── index.html
└── js/
└── feedback.js

---

## server.js — Three Endpoints Only
POST /api/scan-menu
→ Accepts base64 image from browser
→ Calls OpenRouter vision API (key stays server-side)
→ Models in fallback order:
1. meta-llama/llama-3.2-11b-vision-instruct:free
2. qwen/qwen-2-vl-7b-instruct:free
3. google/gemini-flash-1.5-8b
→ Returns parsed JSON array of menu items
POST /api/publish-menu
→ Accepts { menuId, date, items[] }
→ Uses SUPABASE_SERVICE_KEY to bypass RLS
→ Upserts menu row, deletes old items, inserts fresh items
→ Returns { success: true }
POST /api/update-order-status
→ Accepts { bookingId, status }
→ Uses SUPABASE_SERVICE_KEY
→ Updates order status
→ Returns { success: true }

OpenRouter and Supabase service key NEVER touch the browser.

---

## User Flows

### Owner Flow
/admin/index.html       → login with email + password (Supabase Auth)
/admin/menu-upload.html → open camera or upload photo
→ AI scans image via OpenRouter
→ editable item cards appear
→ hit Publish
→ menu goes live instantly for all customers
/admin/dashboard.html   → see all today's orders in real time
→ mark orders: pending → ready → collected
→ see feedback table (live)
→ export feedback as CSV

### Customer Flow
/menu/index.html        → see today's menu (no login)
→ add items to cart (floating cart button)
→ cart drawer slides in from right
/order/checkout.html    → enter name + phone number only (no password)
→ place order
/order/confirmation.html → see Booking ID: BKR-2205-K7X2
→ receipt-style page with all items + total
→ "Show this at the counter, pay and collect"
→ Copy Booking ID button

---

## Booking ID Format
BKR-DDMM-XXXX
↑         ↑
day+month   4 random uppercase alphanumeric chars
Example: BKR-2205-K7X2 (placed on 22 May)

---

## Real-Time Behaviour

| Event | What Happens |
|---|---|
| Owner publishes menu | All customer menu pages update within 2 seconds, no refresh |
| Customer places order | Admin dashboard shows new order instantly with highlight |
| Customer submits feedback | Admin feedback table shows new row instantly |
| Admin marks order ready | Order status badge updates live |

---

## Vercel Deployment

```json
// vercel.json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server.js" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

Environment variables to add in Vercel dashboard:
OPENROUTER_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
OWNER_EMAIL
OWNER_PASSWORD
PORT

Auto-deploy: connect GitHub repo → every push to main deploys automatically.

---

## What Is NOT Being Built
✗ No online payments
✗ No customer account creation or passwords
✗ No Shopify integration
✗ No React / Next.js / Tailwind (unless already in cloned repo)
✗ No mobile app
✗ No complex checkout flow
✗ No email/SMS notifications (can add later)
✗ No inventory management

---

## Phase Checklist

### Phase 1 — Database
- [ ] Run SQL migrations (4 tables)
- [ ] Enable Realtime on all tables
- [ ] Apply RLS policies
- [ ] Verify Supabase connection

### Phase 2 — Proxy Server
- [ ] server.js with 3 endpoints
- [ ] OpenRouter integration with fallback models
- [ ] Supabase service role operations
- [ ] Test /health endpoint

### Phase 3 — Admin Panel
- [ ] Owner login page
- [ ] Camera capture + file upload
- [ ] OCR scan via /api/scan-menu
- [ ] Editable item cards
- [ ] Publish via /api/publish-menu
- [ ] Dashboard with live orders
- [ ] Order status updates
- [ ] Feedback table + CSV export

### Phase 4 — Customer Pages
- [ ] Menu page with category grouping
- [ ] Supabase Realtime subscription
- [ ] Cart drawer (sessionStorage)
- [ ] Checkout (name + phone only)
- [ ] Booking ID generation
- [ ] Confirmation receipt page

### Phase 5 — Feedback
- [ ] Public feedback form
- [ ] Supabase insert
- [ ] Live table in admin dashboard

### Phase 6 — Deployment
- [ ] vercel.json configured
- [ ] .env variables set in Vercel dashboard
- [ ] GitHub repo connected
- [ ] Auto-deploy tested
- [ ] All pages verified on live URL

### Phase 7 — Visual Polish
- [ ] All new pages match existing site design exactly
- [ ] Mobile responsive
- [ ] Loading states on all async actions
- [ ] Error states handled gracefully
- [ ] Empty states are friendly and on-brand

---

## Success Criteria

- [ ] Owner can photograph a menu and have it live in under 60 seconds
- [ ] Customer can place an order in under 2 minutes with just name + phone
- [ ] Booking ID is unique, memorable, and easy to show at counter
- [ ] Admin sees new orders appear without refreshing the page
- [ ] Site deploys to Vercel with one push to GitHub
- [ ] Nothing on the existing pages is broken