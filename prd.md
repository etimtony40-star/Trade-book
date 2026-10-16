# TradeBook: Product Requirements Document

| | |
|---|---|
| **Product** | TradeBook, a sales ledger for small traders |
| **Version** | 1.1 |
| **Status** | Draft |
| **Platform** | Web app (HTML, CSS, JavaScript), runs in the browser, data stored on the device |
| **Currency / locale** | Nigerian Naira (₦), `en-NG`, WhatsApp numbers in `234` format |

---

## 1. Problem Statement and Vision

### 1.1 Problem
Small traders in Nigeria (provision stores, fabric sellers, market stalls, small wholesalers) run their sales on paper notebooks, WhatsApp chats and memory. This causes five recurring problems:

1. **No professional paperwork.** Customers get handwritten notes or nothing, which weakens trust and makes bigger buyers harder to win.
2. **Lost track of who owes what.** Credit sales and part payments are scattered across chats and notebooks, so money goes uncollected.
3. **Awkward follow-ups.** Reminding a customer to pay means typing a new message every time.
4. **Informal lending has no structure.** Traders lend cash to regular customers with no due date, no interest tracking and no record of repayments.
5. **Existing tools don't fit.** Accounting software is too complex, needs accounts and subscriptions, and often assumes reliable internet.

### 1.2 Vision
A trader opens TradeBook on their phone, issues a clean invoice or receipt in under a minute, sends it on WhatsApp, and at any moment sees exactly how much has been sold, how much has been received and who still owes them. It works with no sign-up, no server and no subscription.

### 1.3 Target users
- **Primary:** Sole traders and small shop owners who sell on credit and handle their own record keeping.
- **Secondary:** Small teams (a shop owner and one assistant) sharing a single device.
- **Not targeted in v1:** Businesses needing multi-user accounts, formal accounting, payroll or inventory management.

### 1.4 Product principles
- **Fast first:** the common job (create, save, send) takes few taps.
- **Works without an account:** all data stays on the user's device.
- **Mobile first:** every screen is usable on a small phone.
- **Honest about limits:** TradeBook records and reminds. It does not move real money or send messages by itself.

---

## 2. Core Goals

Each goal is testable.

| ID | Goal | How to test it |
|---|---|---|
| G1 | A trader can create, save and number an invoice or receipt. | A new user saves an invoice in under 90 seconds and it appears in the ledger as `INV-0001`. |
| G2 | A saved document can be delivered to the customer. | The user can download a PDF, print, send on WhatsApp, send by email or copy a message. |
| G3 | The trader always knows what is owed and what is received. | The dashboard totals equal the sum of the underlying documents, payments and loans. |
| G4 | Part payments and receipts are recorded without double counting. | Recording a part payment issues a linked receipt and reduces the invoice balance by exactly that amount. |
| G5 | Repeat customers are remembered. | Saving a document stores the client, and typing the same name later auto-fills their contact details. |
| G6 | A trader can lend money with interest, a due date and reminders. | A loan accrues interest every minute and shows a live "days left" countdown. |
| G7 | Overdue loans are collected automatically in the ledger. | When a loan passes its due date, the full balance is debited from the client's TradeBook account and a notification is shown, even if the account goes negative. |
| G8 | Data is safe and portable. | The user can export a backup and restore it, and export the ledger as CSV. |
| G9 | The app works offline after first load and on mobile. | All core flows work with no connection (except PDF generation if the PDF library has not loaded) and on a 360px-wide screen. |

---

## 3. User Personas and Journeys

### 3.1 Personas

**Adaeze, the provision store owner (primary)**
- Age 38, sells groceries from a shop and gives credit to regular customers.
- Uses an Android phone with limited data. Lives in WhatsApp.
- Needs: a quick receipt for every sale, and a clear view of who owes her.
- Frustration: forgetting part payments and chasing customers by hand.

**Emeka, the fabric wholesaler (primary)**
- Age 45, sells to tailors and boutiques, sometimes lends small amounts to trusted buyers.
- Needs: professional invoices with his logo and bank details, and a way to track informal loans with interest.
- Frustration: customers who delay repayment with no consequence.

**Blessing, the shop assistant (secondary)**
- Age 24, runs the shop while the owner is away, using the owner's device.
- Needs: simple screens and the ability to record a payment or print a receipt quickly.
- Frustration: apps with too many options.

### 3.2 Journeys

**Journey A: First-time setup**
1. User opens TradeBook. The ledger is empty and shows "No sales recorded yet".
2. User opens **My business** and enters business name, phone, email, address, bank details, default VAT, logo, signature, brand colour and payment link.
3. User saves. All new documents now carry this header.
4. Optionally, the user loads sample sales to see how the ledger works.

**Journey B: Make a sale and send an invoice**
1. User taps **Create document** and chooses **Invoice**.
2. User enters the customer name (existing clients auto-fill phone, email and address), picks payment terms and adds items with quantity and price. Discount and VAT are applied if needed.
3. The live preview updates as the user types.
4. User taps **Save to ledger**. The invoice gets the next number and the client is stored.
5. User taps **Send on WhatsApp**. WhatsApp opens with a prefilled message. A draft invoice becomes **Sent**.
6. Optionally, the user downloads a PDF.

**Journey C: Collect a part payment**
1. On the ledger, the user finds an unpaid invoice and taps **Record payment**.
2. User enters the amount received (default is the full balance).
3. TradeBook records the payment, issues a linked receipt (`RCT-xxxx`) and updates the invoice to **Part paid** or **Paid**.
4. Dashboard "Money received" and "Still owed to you" update immediately.

**Journey D: Chase an overdue invoice**
1. The dashboard shows a banner "N overdue" with the amount waiting to be collected.
2. User taps **Show overdue**, then **Remind** on a row.
3. WhatsApp opens with a reminder message that includes the balance and due date.

**Journey E: Lend money and get repaid or debited**
1. User opens **Loans** and enters client, phone, amount, interest rate and **days to repay**.
2. User taps **Lend money**. The loan appears with a live balance, next-interest countdown and a "days left" countdown.
3. Each minute, interest is added, a reminder appears on screen and (if enabled) as a phone or desktop alert. The user can tap **Send to client** to message them on WhatsApp.
4. **Path 1, repaid:** the user taps **Record repayment** or **Settle in full**. The loan closes when the balance reaches zero.
5. **Path 2, deadline passes:** TradeBook closes the loan, debits the full balance from the client's TradeBook account and notifies the user. The account may show a negative balance.
6. Later, the user opens **Clients** and taps **Add funds** when the client pays money in. The negative balance shrinks by that amount, down to zero or into positive.

**Journey F: Protect and move data**
1. User opens **My business** and taps **Download backup** to save a JSON file.
2. On a new device or browser, the user taps **Restore backup** and confirms.
3. User can also export the ledger as CSV from the dashboard.

---

## 4. Functional Requirements

Format: user story, then acceptance criteria written as testable statements.

### 4.1 Business profile

**FR-1: Business details**
*As a trader, I want my business details to appear on every document so my paperwork looks professional.*
- AC1: Business name, phone, email, address, bank/payment details, default VAT and online payment link can be saved.
- AC2: Saved details appear in the document header and the "How to pay" block of unpaid invoices.
- AC3: Logo and signature images can be uploaded, are resized on upload, and appear on the document. They can be removed together with **Remove logo and signature**.
- AC4: A brand colour can be chosen and is applied to the interface, document accent and favicon.
- AC5: Default payment terms (Due on receipt, Net 7, Net 15, Net 30) pre-fill new invoices.
- AC6: If no business name is set, the preview shows "Your business name".

### 4.2 Invoices and receipts

**FR-2: Create a document**
*As a trader, I want to create an invoice or a receipt so I can record a sale.*
- AC1: The user can switch between **Invoice** and **Receipt**.
- AC2: Each document has customer name, phone, email, address, date, items (description, quantity, unit price), discount %, VAT % and notes.
- AC3: Items can be added and removed. At least one item always remains.
- AC4: The preview updates on every keystroke and shows subtotal, discount, VAT and total, all in ₦ with two decimals.
- AC5: Invoices show due date and terms. Receipts hide due date and payment status.
- AC6: VAT defaults to the business default and discount defaults to 0.

**FR-3: Payment terms and due dates**
*As a trader, I want due dates to be calculated for me.*
- AC1: Choosing Net 7, 15 or 30 sets the due date to the document date plus that many days.
- AC2: Changing the date recalculates the due date unless a custom due date was chosen.
- AC3: Manually editing the due date switches terms to "Custom due date".

**FR-4: Save to ledger**
*As a trader, I want each document stored with its own number.*
- AC1: Saving requires a customer name and at least one item with quantity and price above zero. Otherwise a message explains what is missing and nothing is saved.
- AC2: The first save assigns the next number in sequence: `INV-0001`, `INV-0002`, and separately `RCT-0001` and so on.
- AC3: Editing a saved document updates it in place and keeps its number.
- AC4: Receipts are always saved as paid.
- AC5: Saving creates or updates the client record with name, phone, email and address.

**FR-5: Deliver a document**
*As a trader, I want to send the document to my customer in the channel they use.*
- AC1: **Download PDF** produces an A4 PDF named `<number>-<customer>.pdf`. If the document is not yet saved it is saved first.
- AC2: **Print** prints only the document preview, not the app interface.
- AC3: **Send on WhatsApp** opens `wa.me` with a prefilled message listing items, total and payment details. Numbers starting with `0` are converted to `234`.
- AC4: **Send by email** opens the mail app with subject and body prefilled.
- AC5: **Copy message** copies the same message text to the clipboard.
- AC6: Sending requires the document to be saved first, with a message if not.
- AC7: Sending a draft invoice by WhatsApp or email changes its status to **Sent**.
- AC8: If no phone number is saved, the message is copied instead and the user is told.

### 4.3 Sales ledger and dashboard

**FR-6: Ledger totals**
*As a trader, I want to see my sales position at a glance.*
- AC1: The dashboard shows **Total sales**, **Money received**, **Still owed to you** and **Documents** count.
- AC2: Total sales is the sum of invoice and receipt totals, excluding linked payment receipts, so payments are not double counted.
- AC3: Money received includes full payments, part payments, and loan repayments.
- AC4: Still owed to you includes unpaid invoice balances, open loan balances and any negative client account balances.
- AC5: A bar chart shows sales for the last 7 days.
- AC6: Two lists show the latest money received and who owes the most, each with a total.

**FR-7: Search, filter and export**
*As a trader, I want to find a document quickly.*
- AC1: Search matches customer name or document number as the user types.
- AC2: Filters: All, Paid, Unpaid, Overdue, Invoices, Receipts.
- AC3: **Export CSV** downloads number, type, customer, phone, date, due, status, total and balance for every document. If the ledger is empty the user is told there is nothing to export.

**FR-8: Document statuses**
*As a trader, I want accurate statuses so I know what needs attention.*
- AC1: Statuses are Draft, Sent, Viewed, Part paid, Paid and Overdue.
- AC2: A document is **Paid** when its balance is zero. It is **Overdue** when unpaid and its due date is before today. It is **Part paid** when some, but not all, has been received.
- AC3: Paid documents show a PAID stamp on the preview.

**FR-9: Record payments**
*As a trader, I want to record money received against an invoice.*
- AC1: **Record payment** prompts for an amount defaulting to the balance.
- AC2: Amounts above the balance are capped at the balance. Zero or invalid amounts are rejected with a message.
- AC3: Each payment creates a linked receipt with its own `RCT` number that references the invoice and shows the remaining balance.
- AC4: When the balance reaches zero the invoice becomes **Paid**.
- AC5: Paid invoices no longer show **Record payment** or **Remind**.

**FR-10: Overdue reminders**
*As a trader, I want to remind late payers quickly.*
- AC1: When any invoice is overdue, a banner shows the count and total balance.
- AC2: **Show overdue** applies the overdue filter.
- AC3: **Remind** on a row opens WhatsApp with a message containing the document number, balance and due date.

**FR-11: Delete**
- AC1: Deleting a document asks for confirmation and cannot be undone once confirmed.

**FR-12: Sample data**
- AC1: When the ledger is empty, **Load sample sales** adds six realistic documents and clients so the user can explore.

### 4.4 Clients

**FR-13: Client list**
*As a trader, I want to see each customer's history and balance.*
- AC1: The Clients page lists every client with contact, number of documents, total billed, amount owed and account balance.
- AC2: **Owes you** includes unpaid invoice balances, open loan balances and any negative account balance.
- AC3: **New invoice** opens a new document pre-filled with that client's details.
- AC4: **History** opens the ledger filtered to that client.
- AC5: Typing a saved client name in any customer field auto-fills phone, email and address.

**FR-14: Client account balance**
*As a trader, I want to record money a client has paid in, so overdue loans can be cleared against it.*
- AC1: Each client has an account balance, starting at ₦0.00.
- AC2: **Add funds** prompts for an amount above zero and adds it to the balance.
- AC3: A negative balance is shown in red with a minus sign.
- AC4: A balance of ₦0.00 or more is shown normally.

### 4.5 Loans

**FR-15: Lend money**
*As a trader, I want to record a loan with interest and a deadline.*
- AC1: Required inputs: client name, amount above zero, interest rate (% of the amount every minute, zero or more) and **Days to repay** above zero.
- AC2: A helper line shows the equivalent hourly and daily rate and warns about local money-lending rules.
- AC3: The loan is saved with start time, due time and phone number. The client is created if new.
- AC4: Missing or invalid inputs show a message and no loan is created.

**FR-16: Interest and balance**
- AC1: Interest is simple interest: `principal × rate% × minutes elapsed`, added every minute.
- AC2: The loans table shows lent amount, started time, interest so far with a "next in Ns" countdown, repaid amount, live balance and status.
- AC3: Balance never goes below zero.

**FR-17: Days-to-repay countdown**
*As a trader, I want to see how long a client has left to repay.*
- AC1: Each open loan shows time left: "N days Hh left", then "Hh Mm left", then "Mm Ss left" as the deadline approaches, plus the due date.
- AC2: The countdown updates every second while the Loans page is open.
- AC3: Loans created before this feature show "No deadline" and are never auto-debited.

**FR-18: Minute reminders**
*As a trader, I want to be told whenever interest is added.*
- AC1: Every minute an open loan accrues interest, an on-screen message appears and an entry is added to the reminders list (latest 10 shown, 25 stored).
- AC2: Reminders can be turned off with **Remind me every minute**.
- AC3: **Turn on phone or desktop alerts** requests browser notification permission. If granted, alerts show the client and amount added.
- AC4: **Send to client** opens WhatsApp with a message about the interest and the current balance.
- AC5: The UI states clearly that TradeBook cannot message clients by itself and that reminders appear while the page is open.

**FR-19: Repayments**
- AC1: **Record repayment** reduces the balance by the amount entered. If it covers the whole balance, the loan is settled.
- AC2: **Settle in full** asks for confirmation and closes the loan with a repayment for the full balance.
- AC3: Repayments count as money received on the dashboard.
- AC4: Settled loans stop accruing interest and show the status **Settled**.

**FR-20: Automatic debit when the due date passes**
*As a trader, when a client does not repay on time, I want the balance taken from their account automatically so my books show the debt clearly.*
- AC1: When the current time reaches a loan's due time, the loan is closed and interest stops at that moment.
- AC2: The full balance (principal plus interest minus repayments) is debited from the client's account.
- AC3: The debit is applied even if the account has less than the balance, and the account shows a negative amount. Example: the account holds ₦200,000 and the balance is ₦300,000, so the account shows **-₦100,000**.
- AC4: The loan status shows **Auto-debited** with the date.
- AC5: A notification is shown immediately: an on-screen message, a browser alert if permission was granted, and an entry in the reminders list marked as a debit.
- AC6: The reminders entry offers **Send to client** with a message explaining the debit and the new account balance.
- AC7: If the page was closed at the deadline, the debit and notification happen when the page is next opened.
- AC8: A loan is debited only once.
- AC9: Deleting an auto-debited loan asks for confirmation and returns the debited amount to the client's account.

**FR-21: Negative balance recovery**
*As a trader, when a client pays in money, I want it to clear what they owe.*
- AC1: **Add funds** of an amount smaller than the negative balance reduces the debt by that amount. Example: from -₦100,000, adding ₦50,000 shows **-₦50,000**.
- AC2: **Add funds** equal to the negative balance shows **₦0.00**.
- AC3: **Add funds** larger than the negative balance leaves the surplus as a positive balance.
- AC4: The dashboard updates: negative balances count as **Still owed to you**, and the amount recovered moves to **Money received**.
- AC5: Money received and still owed always add up to the same total before and after a recovery.

### 4.6 Data, settings and platform

**FR-22: Local storage and backup**
- AC1: All data is saved automatically on the device and survives closing the browser.
- AC2: **Download backup** saves everything as `tradebook-backup-<date>.json`.
- AC3: **Restore backup** validates the file, asks for confirmation, replaces all data and reloads. An invalid file shows an error and changes nothing.
- AC4: If the browser blocks storage, the user is told that saving failed.

**FR-23: Appearance**
- AC1: A light and dark theme can be toggled and the choice is remembered. First visit follows the device setting.
- AC2: The interface adapts to phone widths: tables become stacked cards, navigation wraps and forms become single column.
- AC3: Reduced-motion preferences are respected.
- AC4: The user's place (current screen and in-progress document) is restored after reload.

**FR-24: Security of user content**
- AC1: All user-entered text is escaped before display so names, notes and items cannot inject markup.

---

## 5. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Dashboard renders in under 1 second with 500 documents on a mid-range Android phone. |
| Offline | After the first load, all features except PDF generation (if its library isn't cached) work with no internet. |
| Privacy | No data leaves the device unless the user shares it. No analytics or accounts in v1. |
| Accessibility | Keyboard focus is visible, form controls have labels, status messages use `role="status"`. |
| Compatibility | Current Chrome, Edge, Safari and Firefox on Android, iOS and desktop. |
| Storage | Works within normal browser local storage limits. Logo and signature images are downsized before saving. |
| Data integrity | Document numbers never repeat. Totals are always recalculated from source records, never stored separately. |

---

## 6. Success Metrics

Metrics are measured with self-reported surveys and optional opt-in feedback in v1 (no analytics are collected). Targets apply at 90 days after launch.

### 6.1 Adoption and activation
| Metric | Definition | Target |
|---|---|---|
| Activation rate | New users who save at least one document in their first session. | ≥ 60% |
| Time to first document | Time from opening the app to first saved document. | ≤ 90 seconds (median) |
| Setup completion | Users who save business details. | ≥ 50% |

### 6.2 Engagement and retention
| Metric | Definition | Target |
|---|---|---|
| Weekly active traders | Users who save or update a document in a week. | ≥ 40% of activated users |
| Documents per active trader | Average documents created per week. | ≥ 10 |
| Sharing rate | Saved documents sent by WhatsApp, email, PDF or print. | ≥ 50% |
| 30-day retention | Activated users still active 30 days later. | ≥ 35% |

### 6.3 Outcomes for the trader
| Metric | Definition | Target |
|---|---|---|
| Collection speed | Average days from invoice date to full payment for users who use reminders vs those who don't. | ≥ 20% faster with reminders |
| Reminder usage | Overdue invoices that get a **Remind** action. | ≥ 50% |
| Credit visibility | Users reporting they know who owes them (survey, 5-point scale). | ≥ 4.0 average |
| Loan recovery | Open loans that end repaid or auto-debited rather than abandoned. | ≥ 80% |

### 6.4 Quality and trust
| Metric | Definition | Target |
|---|---|---|
| Calculation accuracy | Dashboard totals matching a manual sum in testing. | 100% |
| Data loss reports | Reports of lost data per 1,000 users. | < 2 |
| Backup adoption | Active users who have downloaded at least one backup. | ≥ 30% |
| Mobile usability | Users rating phone use as easy (survey). | ≥ 85% |
| Crash/blocking bugs | Open P0 or P1 bugs at release. | 0 |

---

## 7. Out of Scope (v1)

- Real bank, card or mobile-money debits. The client account is an in-app ledger balance only.
- Sending messages automatically. WhatsApp and email always open for the user to send.
- User accounts, logins, multi-user roles and cloud sync.
- Inventory, stock tracking, payroll and tax filing.
- Online payment processing (the payment link is only displayed to customers).
- Legal or financial advice, including interest-rate compliance.

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Users assume the account debit moves real money. | Wrong expectations, disputes. | Label the account as an in-app ledger balance. State it in help text and in the lend form. |
| Data stored only on the device is lost if the browser is cleared or the phone is lost. | Loss of business records. | Prominent backup and restore, reminders to back up. |
| Reminders and auto-debit only run while the page is open. | Missed notifications. | Debits catch up on next open. Explain the limitation in the UI. |
| High interest rates (e.g. per-minute) become harsh quickly. | Customer harm, legal exposure. | Show the hourly and daily equivalent while entering the rate, and show a warning about local lending rules. |
| Browser blocks storage or notifications. | Features fail silently. | Show clear messages when saving fails or alerts are not allowed. |
| PDF library needs internet on first load. | PDF button unavailable offline. | Provide Print as a fallback and cache the library. |

## 9. Open Questions

1. Should interest accrue per minute at all by default, or should daily and monthly rates be offered?
2. Should auto-debit also apply to overdue invoices, not only loans?
3. Should client account top-ups be recorded with a history of deposits and debits?
4. Should the app offer an optional cloud backup for users who change phones often?
5. Should a grace period be available before the auto-debit takes effect?

## 10. Release Plan

| Milestone | Scope |
|---|---|
| v1.0 | Business profile, invoices and receipts, ledger, clients, part payments, loans with minute interest and reminders, backup and CSV, dark mode, mobile layout. |
| v1.1 (this PRD) | Loan due dates with days-left countdown, automatic debit of overdue loans, client account balances with negative balances, Add funds recovery, debit notifications. |
| v1.2 (proposed) | Account transaction history, grace period before debit, overdue-invoice reminders on a schedule. |