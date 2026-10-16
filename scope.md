# TradeBook: Scope

**Product:** TradeBook, a sales ledger for small traders
**Release in scope:** v1.1 (first working release, including loans with due dates and auto-debit)
**Companion document:** `prd.md`

> Anything not listed under "MVP Features" is not part of this release. If something is not in this file, do not build it.

---

## 1. Minimum Viable Product (MVP) Features

The first working release must contain exactly the following and nothing else. Each item must work on a phone-width screen and in both light and dark theme.

### 1.1 Business profile
- [ ] Save business name, phone, email, address, payment details (bank or account), default VAT %, online payment link
- [ ] Upload logo and signature (resized on upload) and remove both
- [ ] Choose a brand colour and a default payment term (Due on receipt, Net 7, Net 15, Net 30)

### 1.2 Invoices and receipts
- [ ] Create an **Invoice** or a **Receipt** with customer name, phone, email, address, date, items (description, quantity, price), discount %, VAT % and notes
- [ ] Live preview that updates as the user types
- [ ] Automatic due date from payment terms, with a custom due date option
- [ ] Save to ledger with automatic numbering (`INV-0001`, `RCT-0001`), edit a saved document, delete with confirmation
- [ ] Validation: customer name and at least one item with quantity and price are required

### 1.3 Delivering documents
- [ ] Download PDF (A4), Print, Send on WhatsApp, Send by email, Copy message
- [ ] Nigerian phone numbers starting with `0` converted to `234` for WhatsApp
- [ ] Sending a draft invoice marks it **Sent**

### 1.4 Sales ledger
- [ ] Dashboard totals: Total sales, Money received, Still owed to you, Documents
- [ ] 7-day sales chart, latest money received list, who owes the most list
- [ ] Search by customer or number, and filters (All, Paid, Unpaid, Overdue, Invoices, Receipts)
- [ ] Statuses: Draft, Sent, Viewed, Part paid, Paid, Overdue
- [ ] Overdue banner with a Show overdue action
- [ ] CSV export
- [ ] Sample data loader for an empty ledger

### 1.5 Payments and reminders
- [ ] Record a full or part payment, which issues a linked receipt and updates the balance
- [ ] Payment amount capped at the balance, invalid amounts rejected
- [ ] Remind button that opens WhatsApp with a prefilled message

### 1.6 Clients
- [ ] Clients saved automatically when a document is saved
- [ ] Auto-fill contact details when a known client name is typed
- [ ] Client list with documents count, total billed, amount owed, account balance
- [ ] New invoice and History actions per client
- [ ] **Account balance** per client with an **Add funds** action

### 1.7 Loans
- [ ] Lend money: client, phone, amount, interest % per minute, **days to repay**
- [ ] Simple interest added every minute, live balance, and live "next interest in" countdown
- [ ] Live **days-left countdown** and due date on each open loan
- [ ] Minute reminders: on-screen message, reminders list, optional browser alerts, Send to client by WhatsApp, on/off switch
- [ ] Record repayment, Settle in full, Delete (with confirmation)
- [ ] **Automatic debit at the due date:** the full balance is taken from the client's TradeBook account even if the account goes negative (example: account ₦200,000, balance ₦300,000, account shows -₦100,000), the loan shows **Auto-debited**, and a notification is shown
- [ ] **Recovery:** Add funds reduces a negative balance by the amount added (-₦100,000 plus ₦50,000 shows -₦50,000, and ₦100,000 or more shows ₦0.00 or above)
- [ ] Debit is applied only once, and catches up on next open if the page was closed at the deadline
- [ ] Deleting an auto-debited loan returns the debited amount to the client's account
- [ ] Dashboard counts negative balances as owed and recovered money as received

### 1.8 Data and platform
- [ ] All data stored in the browser on the user's device
- [ ] Backup download and restore (JSON) with confirmation and file validation
- [ ] Light and dark theme, remembered
- [ ] Mobile-friendly layout (tables become cards under 700px)
- [ ] Restore the user's last screen and in-progress document after reload
- [ ] All user-entered text escaped before display

### 1.9 MVP definition of done
- [ ] Every checkbox above works on current Chrome and Safari, on Android, iOS and desktop
- [ ] Dashboard totals match a manual sum of the underlying records in testing
- [ ] No open P0 or P1 bugs
- [ ] Money received plus still owed stays consistent before and after a recovery
- [ ] The auto-debit scenario (₦200,000 account, ₦300,000 loan, then ₦50,000 and ₦100,000 top-ups) passes as written

---

## 2. Explicitly Out of Scope

Do **not** build any of the following in this release.

- **No real money movement.** Do not connect to banks, cards, USSD or mobile-money services. The client account is an in-app ledger balance only. Do not describe it to users as a bank account.
- **No payment processing.** Do not integrate Paystack, Flutterwave or similar. The online payment link is only displayed to customers.
- **No automatic messaging.** Do not send WhatsApp, SMS or email from a server. The user always taps Send.
- **No user authentication.** No sign-up, login, passwords, roles or multi-user access.
- **No backend or cloud sync.** No server, database, API or accounts. Data stays on the device.
- **No inventory or stock management.**
- **No payroll, tax filing or formal accounting** (no chart of accounts, balance sheet or profit and loss).
- **No multi-currency.** Naira only.
- **No multiple businesses or branches** in one install.
- **No scheduled background jobs.** Reminders and auto-debit run while the page is open and catch up on next open. Do not build push notifications from a server or a service worker for this.
- **No account transaction history** (a log of every deposit and debit).
- **No grace period or configurable late fees** before the auto-debit.
- **No auto-debit for overdue invoices.** It applies to loans only.
- **No analytics, tracking or ads.**
- **No native mobile apps.** The web app only. (A mobile-friendly layout *is* in scope.)
- **No legal or financial advice** or built-in interest-rate compliance checking.

---

## 3. Future Roadmap / Release Slices

### v1.2: Account clarity and control
- Account transaction history (every deposit, debit and reversal with date and reference)
- Optional grace period (in days) before the auto-debit
- Scheduled reminders for overdue invoices
- Daily and monthly interest options as an alternative to per-minute

### v2.0: Reliable and shared
- Optional sign-in and cloud backup, so data survives a lost phone
- Multi-user access with roles (owner, assistant)
- Installable app (PWA) with a service worker, full offline PDF generation and background reminders
- Auto-debit for overdue invoices with configurable rules

### v2.x: Connected and wider
- Mobile-money and bank payment links with automatic reconciliation
- SMS and WhatsApp Business API reminders sent from a server
- Basic inventory and stock levels linked to items sold
- Reports: profit and loss, best customers, aging report
- Multiple businesses and branches
- Languages: Yoruba, Igbo, Hausa, Pidgin
- Additional currencies

---

## 4. Current Constraints

> Delivery dates and budget were not provided. The timeline and budget rows are working assumptions: edit them to match your real plan.

### 4.1 Technical constraints (fixed)
| Constraint | Detail |
|---|---|
| Stack | Plain HTML, CSS and JavaScript in three files: `index.html`, `style.css`, `script.js`. No framework, no build step. |
| Storage | Browser `localStorage` only. No backend, so there is no server-side backup. |
| Dependencies | `html2pdf` for PDF export. No other third-party libraries. |
| Hosting | Static hosting only (or opening the files directly). |
| Reminders and auto-debit | Run in the open page only. They cannot fire while the browser or tab is closed. |
| Messaging | Uses `wa.me` and `mailto:` links, so the user must complete the send. |
| Browsers | Current Chrome, Edge, Safari and Firefox. Browser alerts depend on the user granting permission. |
| Performance | Dashboard renders in under 1 second with 500 documents on a mid-range Android phone. |
| Screens | Usable from 360px wide upward. |

### 4.2 Timeline (assumed)
| Item | Assumption |
|---|---|
| Release scope | v1.1 as listed in Section 1 only |
| Change control | Any new feature during this release is moved to Section 3 unless it fixes a bug in Section 1 |

### 4.3 Budget (assumed)
| Item | Assumption |
|---|---|
| Spend | Zero recurring cost: no servers, no paid APIs, no subscriptions |
| Team | One developer |

### 4.4 Regulatory and compliance baselines
| Area | Requirement |
|---|---|
| Money lending | Interest and lending are subject to Nigerian and state-level money-lending rules. The app must show the warning to check local rules before lending, and must not present itself as legal advice. |
| Data protection | Customer names, phone numbers and addresses are personal data under the Nigeria Data Protection Act. In this release, data stays on the user's device and is never transmitted, which is the compliance baseline. Any future cloud feature requires a privacy review first. |
| VAT | VAT is a user-set percentage per document and a default in settings. The app does not calculate or file tax. |
| Honest labelling | The account balance must be described as an in-app ledger balance, never as a bank account or a real debit. |
| Consumer fairness | Show the hourly and daily equivalent of the interest rate while entering a loan, so the cost is visible. |

---

## 5. Change Control

1. Anything outside Section 1 needs an entry in Section 3 first.
2. A feature may move from Section 3 into Section 1 only by removing something of equal effort or moving the release date.
3. Section 2 items need an explicit decision recorded in `prd.md` (Open Questions) before they are started.