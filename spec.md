# TradeBook: Technical Specification

| | |
|---|---|
| **Version** | 1.1 |
| **Companion docs** | `prd.md` (what and why), `scope.md` (what is in and out) |
| **Status of this spec** | Sections 1 to 4 describe the code as it exists. Anything marked **(proposed)** is not built yet. |

> **For AI coding agents:** Treat this file as the source of truth for data shapes and boundaries. Do not rename storage keys or fields, do not add a backend, framework or build step, and do not add dependencies unless this spec is updated first.

---

## 1. The Tech Stack

### 1.1 Chosen stack (v1.1)

| Layer | Choice | Notes |
|---|---|---|
| Markup | HTML5, single page, one `<section class="view">` per screen | `index.html` |
| Styling | Plain CSS with custom properties (design tokens) | `style.css`. No Tailwind, no preprocessor. |
| Language | Vanilla JavaScript (ES2020+), no modules, no transpiler | `script.js`, loaded with a plain `<script>` tag |
| Framework | None | No React, Vue or build step |
| Database | Browser `localStorage` | One JSON document under key `tradebook.v1` |
| Authentication | None | Single user per device |
| PDF generation | `html2pdf.js` (loaded from a CDN in the page head or before `script.js`) | Exposed as `window.html2pdf`. The app must degrade to Print if it is missing. |
| Messaging | `wa.me` deep links and `mailto:` links | No API keys, no server |
| Notifications | Web Notifications API | Optional, permission-gated |
| File save | File System Access API (`showSaveFilePicker`) with `<a download>` fallback | |
| Fonts | System fonts, with `Georgia` for headings | No web fonts |
| Hosting | Any static host: Netlify, Vercel (static), GitHub Pages, Cloudflare Pages, or open the files locally | No server runtime |
| Package manager | None needed to run. `npm` is used only for dev tools (Section 4) **(proposed)** | |

### 1.2 File layout

```
tradebook/
├── index.html      # structure, all views, no inline logic
├── style.css       # tokens, layout, components, responsive, print
├── script.js       # all behaviour (sections described in 3.2)
├── prd.md
├── scope.md
└── spec.md
```

### 1.3 Browser support
Current Chrome, Edge, Safari and Firefox on Android, iOS and desktop. Minimum width 360px.

### 1.4 Stack rules
- **Do not** introduce a framework, bundler, TypeScript compile step, or backend in v1.x.
- **Do not** call any network endpoint other than the CDN script for `html2pdf` and `wa.me` / `mailto:` links opened by user action.
- All persistence goes through the single `save()` function.

---

## 2. Data Models and Database Schema

TradeBook has no SQL database. State is one JavaScript object `S`, saved as JSON in `localStorage`. The model below is written as tables so relationships are explicit. "PK" and "FK" are logical, enforced by code, not by a database engine.

### 2.1 Storage keys

| Key | Content |
|---|---|
| `tradebook.v1` | The whole state object `S` (all tables below) |
| `tradebook.ui` | `{ v: <current view id>, cur: <in-progress document> }`. Restores the user's place after reload. |
| `tradebook.theme` | `"light"` or `"dark"` |

### 2.2 Root state `S`

| Field | Type | Description |
|---|---|---|
| `settings` | object | Business profile (2.3) |
| `docs` | array of Document | Invoices and receipts (2.4). Newest first. |
| `clients` | array of Client | (2.5) |
| `loans` | array of Loan | (2.6). Newest first. |
| `feed` | array of FeedItem | Reminder and debit notifications (2.7). Max 25, newest first. |
| `n` | `{ INV: number, RCT: number }` | Last used document sequence numbers |
| `rem` | boolean (optional) | Minute reminders on or off. Treated as **on** unless exactly `false`. |

### 2.3 `settings` (one row)

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | string | `""` | Business name |
| `phone` | string | `""` | |
| `email` | string | `""` | |
| `addr` | string | `""` | |
| `bank` | string | `""` | Payment details shown on unpaid invoices |
| `vat` | number | `0` | Default VAT % |
| `link` | string | `""` | Online payment link |
| `color` | string | `"#0b6b4f"` | Hex brand colour |
| `terms` | string | `"0"` | Default terms in days: `"0"`, `"7"`, `"15"`, `"30"` |
| `logo` | string | `""` | PNG data URL, max side 320px |
| `sig` | string | `""` | PNG data URL, max side 360px |

### 2.4 `docs[]` : Document

| Field | Type | Key | Description |
|---|---|---|---|
| `id` | number | **PK** | `Date.now()` at creation. Unique. |
| `type` | `"INV"` \| `"RCT"` | | Invoice or receipt |
| `no` | string | unique | `INV-0001` or `RCT-0001`. Assigned on first save. |
| `date` | string | | `YYYY-MM-DD` local date |
| `due` | string | | `YYYY-MM-DD`, empty for receipts |
| `terms` | string | | `"0"`, `"7"`, `"15"`, `"30"` or `"-1"` (custom) |
| `cust` | string | soft FK → `clients.name` | Customer name |
| `phone`, `email`, `addr` | string | | Customer contact snapshot |
| `items` | array of `{ d: string, q: number, p: number }` | | Description, quantity, unit price |
| `disc` | number | | Discount % |
| `vat` | number | | VAT % |
| `notes` | string | | |
| `status` | `"draft"` \| `"sent"` \| `"viewed"` \| `"paid"` | | Legacy `"unpaid"` is read as `"sent"` |
| `pays` | array of `{ date: string, amt: number }` | | Part payments received |
| `ref` | string | soft FK → `docs.no` | Set only on **payment receipts**: the invoice number paid. Empty otherwise. |
| `bal` | number | | Set only on payment receipts: balance remaining after that payment |

**Derived values (never stored):**

```
sub    = Σ (q × p)
dc     = sub × disc / 100
tax    = (sub − dc) × vat / 100
total  = sub − dc + tax
paidAmt = ref ? 0
        : (type == RCT or status == paid) ? total
        : Σ pays.amt
balOf   = ref ? 0 : max(0, total − paidAmt)
isPaid  = ref ? true : balOf < 0.005
isOver  = !isPaid and due != "" and due < today
```

Documents with `ref` set are **payment receipts**. They are excluded from "Total sales" and "Money received" calculations (the money is counted once, from the invoice's `pays`).

### 2.5 `clients[]` : Client

| Field | Type | Key | Description |
|---|---|---|---|
| `name` | string | **PK** (logical) | Client name. Lookups are case-insensitive and trimmed; some joins use exact match. |
| `phone`, `email`, `addr` | string | | Latest contact details |
| `acct` | number (optional) | | In-app account balance in ₦. `undefined` is treated as `0`. **Negative means the client owes the trader.** |

### 2.6 `loans[]` : Loan

| Field | Type | Key | Description |
|---|---|---|---|
| `id` | number | **PK** | `Date.now()` at creation |
| `client` | string | FK → `clients.name` | |
| `phone` | string | | Contact snapshot |
| `principal` | number | | Amount lent, ₦ |
| `rate` | number | | Interest **% of the principal per `per` seconds** (currently per minute) |
| `per` | number | | Interest period in seconds. `60` for new loans. Missing means `1` (legacy per-second loans). |
| `nt` | number | | Last whole minute for which a reminder was issued |
| `start` | number | | Start time, ms since epoch |
| `days` | number | | Days allowed to repay (fractions allowed). Absent on legacy loans. |
| `due` | number | | Deadline, ms since epoch: `start + days × 86 400 000`. Absent on legacy loans (no deadline). |
| `reps` | array of `{ date: string, amt: number, forced?: 1 }` | | Repayments. `forced: 1` marks the auto-debit entry. |
| `closed` | number | | `0` while open. Otherwise the close time (ms). Interest stops at this time. |
| `forced` | number | | `0`, or the time (ms) the loan was auto-debited |
| `taken` | number (optional) | | Amount debited from the client's account at the due date |

**Derived values:**

```
lInt  = principal × (rate / 100) × floor(((closed || now) − start) / 1000 / per)
lPaid = Σ reps.amt
lBal  = max(0, principal + lInt − lPaid)
```

### 2.7 `feed[]` : FeedItem

| Field | Type | Key | Description |
|---|---|---|---|
| `id` | string | **PK** | `<ms>-<loanId>` for interest, `<ms>-d-<loanId>` for debits |
| `t` | number | | Time, ms |
| `lid` | number | FK → `loans.id` | |
| `client` | string | | Client name snapshot |
| `rpm` | number | | Interest % per minute (interest items) |
| `cnt` | number | | Minutes covered (interest items) |
| `add` | number | | Amount added (interest) or amount debited (debit) |
| `bal` | number | | Loan balance (interest) or account balance after debit (debit) |
| `kind` | `"debit"` (optional) | | Present only on auto-debit items |
| `msg` | string (optional) | | Ready-to-send WhatsApp text for debit items |

### 2.8 Relationships

```
settings (1)

clients (1) ──< docs        docs.cust       → clients.name   (soft FK)
clients (1) ──< loans       loans.client    → clients.name   (soft FK)
docs    (1) ──< docs        receipt.ref     → invoice.no     (payment receipt → invoice)
loans   (1) ──< feed        feed.lid        → loans.id
loans   (1) ──< reps        embedded array inside the loan
docs    (1) ──< pays        embedded array inside the document
docs    (1) ──< items       embedded array inside the document
```

### 2.9 Dashboard formulas

```
all          = docs where ref == ""
Total sales  = Σ total(all)
Money received = Σ paidAmt(all) + Σ lPaid(loans) − NEG
Still owed   = (Total sales − Σ paidAmt(all)) + Σ lBal(loans) + NEG
NEG          = Σ over clients of max(0, −acct)
```

`NEG` is subtracted from received and added to owed because an auto-debit records the **full** loan balance as a repayment, but the part not covered by the client's funds is still unpaid. When the client adds funds, `acct` rises, `NEG` falls, and money moves from "owed" to "received". The two totals always sum to the same value across a recovery.

### 2.10 Invariants (must always hold)
1. `docs.no` is unique and sequence numbers in `S.n` never decrease or repeat.
2. A loan with `closed != 0` never accrues interest.
3. A loan is auto-debited at most once (`forced` is set when it happens).
4. `lBal >= 0` and `balOf >= 0`.
5. Totals are always recomputed from records, never cached.
6. Deleting an auto-debited loan restores `taken` to `clients.acct`.
7. All user text is passed through `esc()` before being placed in HTML.

### 2.11 Migration rules
- Missing fields on old data must be treated as defaults, never as errors (`days`/`due` absent → no deadline, `per` absent → 1 second, `acct` absent → 0, `rem` absent → on).
- The restore routine merges a backup over a default state so older backups stay valid. A backup must contain a `docs` array or it is rejected.
- If the storage shape changes in a breaking way, bump the key to `tradebook.v2` and write a one-time migration.

### 2.12 Relational schema for v2 **(proposed, not built)**
Use PostgreSQL if a backend is added. Amounts are `numeric(14,2)`.

```sql
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,            -- auth user
  name text not null, phone text, email text, address text,
  payment_details text, default_vat numeric(5,2) default 0,
  payment_link text, brand_color text default '#0b6b4f',
  default_terms int default 0, logo_url text, signature_url text
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null, phone text, email text, address text,
  unique (business_id, lower(name))
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  client_id uuid not null references clients(id),
  type text not null check (type in ('INV','RCT')),
  number text not null,
  issue_date date not null, due_date date,
  terms_days int, discount_pct numeric(5,2) default 0, vat_pct numeric(5,2) default 0,
  notes text, status text not null check (status in ('draft','sent','viewed','paid')),
  invoice_id uuid references documents(id),   -- set on payment receipts
  balance_after numeric(14,2),
  unique (business_id, number)
);

create table document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  position int not null, description text, quantity numeric(12,3), unit_price numeric(14,2)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  paid_on date not null, amount numeric(14,2) not null check (amount > 0)
);

create table loans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  client_id uuid not null references clients(id),
  principal numeric(14,2) not null check (principal > 0),
  rate_pct numeric(8,4) not null, period_seconds int not null default 60,
  started_at timestamptz not null, due_at timestamptz,
  closed_at timestamptz, auto_debited_at timestamptz, debited_amount numeric(14,2)
);

create table loan_repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  paid_on date not null, amount numeric(14,2) not null, forced boolean default false
);

create table account_entries (            -- ledger of the client account
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  created_at timestamptz default now(),
  amount numeric(14,2) not null,          -- positive = funds added, negative = debit
  reason text not null check (reason in ('deposit','loan_debit','loan_debit_reversal')),
  loan_id uuid references loans(id)
);
-- client balance = sum(account_entries.amount)
```

---

## 3. API and System Architecture

### 3.1 Boundaries
TradeBook v1.1 is a **client-only application**. There is no backend, no REST API and no authentication.

```
┌──────────────────────── Browser (device) ─────────────────────────┐
│  index.html (views)  ←→  script.js (logic)  ←→  localStorage       │
│                              │                                     │
│                              ├── html2pdf (CDN script) → PDF blob  │
│                              ├── Notifications API → alerts        │
│                              └── File System Access / <a download> │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ user taps a button
                  wa.me link · mailto: link   (opens another app)
```

### 3.2 "Routes" (views)
Navigation is in-page. `go(view)` shows one `<section id="v-<view>">` and calls its render function. The current view is saved in `tradebook.ui`.

| View id | Screen | Render function | Entered by |
|---|---|---|---|
| `dash` | Sales ledger | `renderDash()` | Nav "Ledger", default |
| `new` | New or edit document | `fillForm()` | Nav "New document", Create document, Open, New invoice |
| `cli` | Clients | `renderCli()` | Nav "Clients" |
| `loan` | Loans | `renderLoans()` | Nav "Loans" |
| `set` | My business | `fillSettings()` | Nav "My business" |

### 3.3 Code sections in `script.js`
| Section | Responsibility |
|---|---|
| Helpers | `$`, `$$`, `money`, `esc`, `fd`, `iso`, `today`, `toast`, `num` |
| State | `S`, `save()`, derived functions `totals`, `paidAmt`, `balOf`, `isPaid`, `isOver` |
| Views | `go()`, nav handlers, view persistence (`saveUI`) |
| Editor | `fillForm`, `renderItems`, `preview`, form input handling |
| Documents | save, PDF, print, `msgFor`, `wa`, `mail`, copy |
| Ledger | `renderDash`, `stat`, `pay`, row actions, CSV export, sample data |
| Clients | `renderCli`, client actions (bill, history, **fund**) |
| Settings | `fillSettings`, image resize `img`, `applyColor`, save |
| Loans | `lInt`, `lPaid`, `lBal`, `NEG`, `renderLoans`, `dueCell`, `intCell`, loan actions |
| Reminders | `remind()`, `renderFeed()`, notification permission |
| **Enforcement** | `enforce()`: auto-debit at the due date |
| Backup | download and restore |
| Theme and boot | `theme()`, initial `go()`, `setInterval(tick, 1000)`, final `enforce()` |

### 3.4 Internal function contracts ("endpoints")

| Function | Input | Effect | Returns / side effects |
|---|---|---|---|
| `save()` | none | Writes `S` to `tradebook.v1` | Toasts on failure |
| `go(view)` | view id | Switch view, render it, persist | none |
| `pay(doc)` | document | Prompts for amount, appends to `pays`, creates a linked `RCT`, saves | Re-renders ledger |
| `msgFor(doc, isReminder)` | document, boolean | Builds message text | string |
| `wa(phone, msg)` | string, string | Opens `wa.me/234…?text=` or copies message if no phone | Opens new tab |
| `enforce()` | none | For each open loan with `due <= now`: set `closed = now`, compute `amt = lBal`, `client.acct -= amt`, push forced repayment, set `forced`, `taken`, add feed item, toast, browser notification, save, re-render current view | none |
| `remind()` | none | For each open loan, add a feed item and toast for each full minute elapsed since `nt` (if reminders on) | none |
| `tick()` | none | Every second: `enforce()`, `remind()`, refresh live loan cells and dashboard totals | none |
| Fund action | client index | Prompts for amount `> 0`, `acct += amount`, saves, re-renders clients | Toast with new balance |

### 3.5 Auto-debit sequence

```
tick (every 1s, and once at page load)
  └─ enforce()
       for each loan where closed == 0 and due set and now >= due:
         1. loan.closed = now                     (interest stops)
         2. amt = lBal(loan)
         3. client.acct = (client.acct||0) − amt  (may be negative)
         4. loan.reps.push({date: today, amt, forced: 1})
         5. loan.forced = now; loan.taken = amt
         6. feed.unshift({kind:'debit', add: amt, bal: client.acct, msg})
         7. toast + Notification (if granted)
       if anything changed: save() and re-render active view
```

Worked example: account `200000`, balance `300000` → account becomes `−100000`. Add `50000` → `−50000`. Add `100000` more → `+50000`.

### 3.6 Third-party integrations

| Integration | Direction | Trigger | Data sent | Failure behaviour |
|---|---|---|---|---|
| `html2pdf.js` (CDN) | Download script | Page load | none | If `window.html2pdf` is missing, show a message and suggest Print |
| WhatsApp (`https://wa.me/<number>?text=<encoded>`) | Opens link | User taps a send or remind button | Message text and phone in the URL | No phone → copy message and tell the user |
| Email (`mailto:`) | Opens mail app | User taps Send by email | Subject and body | None |
| Notifications API | Local | User taps "Turn on alerts" | Local notification text | If unsupported or denied, tell the user. On-screen toasts still work. |
| File System Access API | Local | PDF download | PDF blob | Falls back to `<a download>` |

Phone normalisation for WhatsApp: strip non-digits; if the first digit is `0`, replace it with `234`.

### 3.7 Future API **(proposed, v2)**
If a backend is introduced, use REST over HTTPS with JSON, auth by bearer token, and these routes:

```
POST   /auth/login                      POST   /auth/logout
GET    /business                        PUT    /business
GET    /clients                         POST   /clients
GET    /clients/:id                     PATCH  /clients/:id
POST   /clients/:id/account-entries     GET    /clients/:id/account-entries
GET    /documents?status=&q=&type=      POST   /documents
GET    /documents/:id                   PATCH  /documents/:id        DELETE /documents/:id
POST   /documents/:id/payments
GET    /loans                           POST   /loans
POST   /loans/:id/repayments            POST   /loans/:id/settle     DELETE /loans/:id
GET    /export/ledger.csv               GET    /backup               POST /restore
```
Loan auto-debit would move to a scheduled server job so it runs when the app is closed. Reminders would be sent by a server through the WhatsApp Business API or SMS.

---

## 4. Coding Standards and Testing

The existing code is compact by design. The rules below apply to **all new and changed code**. Tools marked **(proposed)** are not yet in the repo.

### 4.1 Language and style
- JavaScript only, `"use strict"` behaviour assumed. Use `const` by default, `let` when reassigning, never `var`.
- No new global variables beyond the existing ones (`S`, `cur`, `curView`). Put new helpers next to related code.
- Prefer small pure functions for calculations (`totals`, `lBal`) and keep DOM work in `render*` functions.
- Use template literals for HTML, and **always** pass user data through `esc()`.
- No inline event handlers in HTML. Attach handlers in `script.js`. Use `data-*` attributes for actions.
- Money: always format with `money()`. Never use floating-point equality. Compare with a tolerance (`< 0.005`).
- Dates: store dates as local `YYYY-MM-DD` strings (`iso()`), timestamps as milliseconds.
- Errors: wrap storage, clipboard, notification and share calls in `try/catch` and tell the user with `toast()`.
- Comments: one short block comment per section (`/* loans */`). Explain *why*, not *what*.

### 4.2 Naming conventions
| Thing | Convention | Examples |
|---|---|---|
| Functions, variables | `camelCase` | `renderLoans`, `balOf` |
| Short domain helpers in the existing style | Keep as is | `lInt`, `lPaid`, `lBal`, `NEG` |
| Constants | `UPPER_SNAKE` or `UPPERCASE` | `KEY`, `UIKEY`, `LOANS` |
| HTML ids | `kebab-case` with a prefix per screen | `#s-name` (settings), `#l-rate` (loans), `#cl-rows` (clients) |
| CSS classes | `kebab-case`, short, component-based | `.card`, `.btn`, `.tag.paid` |
| CSS custom properties | `--short-name` | `--pri`, `--mut`, `--line` |
| Storage keys | `tradebook.<name>` | `tradebook.v1` |
| Data fields | Keep existing short names | `cust`, `pays`, `acct`, `due` |
| New data fields | Descriptive `camelCase`, optional, with a safe default | `taken`, `forced` |

### 4.3 CSS rules
- All colours come from custom properties on `:root`, with a dark override under `:root[data-theme=dark]`.
- Mobile first. The existing breakpoints are 860px, 700px and 480px. Do not add more without a reason.
- Respect `prefers-reduced-motion`.
- Every new table must work in the stacked-card mobile layout (`.rt` class plus header labels).
- Print CSS must keep hiding everything except the document preview.

### 4.4 Linting and formatting **(proposed)**
| Tool | Config |
|---|---|
| ESLint | `eslint:recommended`, `no-var`, `prefer-const`, `eqeqeq` (allow `== null`), `no-unused-vars` (warn), `no-undef` (browser env) |
| Prettier | `printWidth` 120, single quotes, semicolons. Exempt existing compact lines until the file is reformatted in a dedicated commit. |
| Stylelint | `stylelint-config-standard`, custom property pattern `^[a-z]+(-[a-z]+)*$` |
| HTML | `html-validate` with default rules |
| Commit format | Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` |

### 4.5 Testing **(proposed)**
No automated tests exist yet. Add them in this order:

| Layer | Framework | What to test |
|---|---|---|
| Unit | **Vitest** with `jsdom` | Pure calculations and state rules (below) |
| End-to-end | **Playwright** (Chromium, WebKit, mobile viewport 360×740) | Full user flows (below) |
| Accessibility | `@axe-core/playwright` | No serious violations on every view |
| Manual | Checklist before each release | PDF, WhatsApp, email, print, notifications, backup restore on a real phone |

To make unit testing possible without a build step, expose pure functions through a guarded export at the end of `script.js`:
```js
if (typeof module !== 'undefined') module.exports = { totals, paidAmt, balOf, isPaid, lInt, lPaid, lBal, num, money };
```

### 4.6 Required test cases

**Unit (must all pass)**
1. `totals`: subtotal, discount and VAT are correct, including 0%, 100% and decimal values.
2. `paidAmt` and `balOf`: receipts are fully paid, part payments reduce the balance, balance is never negative.
3. `num`: pads to four digits (`INV-0001`, `RCT-0012`).
4. `lInt`: per-minute interest is correct at 0, 1, 59, 60, 61 and 120 seconds, and stops at `closed`.
5. `lBal`: never negative after repayments larger than the balance.
6. `money`: two decimals, `₦` prefix, and handles `0`, `null`, `undefined`.
7. `esc`: escapes `& < > " '`.
8. Dashboard formulas: Total sales, Money received and Still owed are consistent with and without loans.

**Auto-debit and account (must all pass)**
9. Account `200000`, loan balance `300000`, deadline passed → account is `−100000`, loan `forced` and `closed` set, one forced repayment recorded.
10. From `−100000`, adding `50000` → `−50000`; adding `100000` more → `+50000`.
11. Account `500000`, balance `300000` → account becomes `+200000` (no negative).
12. A loan is debited exactly once, even if `enforce()` runs repeatedly or the page reloads.
13. A loan with no `due` is never debited.
14. A loan whose deadline passed while the app was closed is debited on the next load.
15. `Money received + Still owed` is the same number before and after an Add funds recovery.
16. Deleting an auto-debited loan restores `taken` to the account.

**End-to-end (must all pass)**
17. First run: empty ledger message, load sample sales, totals appear.
18. Create and save an invoice, see it as `INV-0001`, confirm validation errors when name or items are missing.
19. Record a part payment, see a linked receipt and **Part paid**, then pay the rest and see **Paid**.
20. Overdue invoice shows the banner and the Remind button opens a `wa.me` URL with the balance.
21. Lend money with a very short deadline (for example `0.0007` days), wait, see the notification, **Auto-debited** tag and the client's negative account.
22. Add funds on the Clients page and watch the negative balance shrink.
23. Backup download then restore returns identical data. A non-backup file is rejected.
24. Reload on each screen keeps the user's place and in-progress document.
25. Dark mode toggle persists and mobile layout shows stacked cards under 700px.

### 4.7 Coverage and quality gates **(proposed)**
| Gate | Threshold |
|---|---|
| Unit coverage of calculation and state functions | ≥ 90% lines and branches |
| End-to-end flows 17 to 25 | 100% pass on Chromium and WebKit |
| Axe accessibility | 0 serious or critical violations |
| Lighthouse (mobile) | Performance ≥ 90, Accessibility ≥ 95 |
| Open P0 or P1 bugs at release | 0 |

### 4.8 Definition of done for any change
1. Matches `scope.md` (feature is in the MVP list, or the scope file is updated first).
2. Data shape changes are reflected in Section 2 of this file.
3. New or changed logic has unit tests, and any user-visible flow has an end-to-end test.
4. Works at 360px width and in dark mode.
5. User text is escaped. No new network calls. No new dependencies.
6. Existing saved data still loads (migration rules in 2.11).