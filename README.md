# Work Tracker — Setup & Security Guide

## What changed in this version

- ✅ **Currency**: All £ → $ USD throughout the app
- ✅ **Auto-fill 37.5h**: Past Sundays without a logged entry get a 37.5h "Auto" entry created silently in the background — fully editable
- ✅ **Edit timesheet entries**: Every row now has an Edit button that loads it into the form
- ✅ **Data tables**: Sortable columns, search, pagination, sticky scroll headers, CSV export — replaces the old flat list
- ✅ **Custom expense categories**: Add, rename, recolor, delete (existing entries fall back to "Other")
- ✅ **Edit expenses**: Full edit/delete on every entry
- ✅ **Recurring subscriptions**: Set name + amount + day-of-month + start date. App auto-creates an expense on that day every month (capped at last day of short months). You can stop or resume anytime; auto-generated entries are tagged `SUB`
- ✅ **Payslips tab**: Save payslips with date range, hours, rate, amount paid. App computes the difference between what timesheet says you should have been paid and what you were actually paid — both per row and as a custom date-range tool
- ✅ **Pay Calculator**: Now defaults overtime rate to 1.5× regular when not specified
- ✅ **Hardened security**: Closed registration in the UI; Firestore Security Rules in `firestore.rules`

---

## ⚠️ MANDATORY security setup (must do before deploying)

The app's HTML alone cannot protect your data. **You must do all three of these in your Firebase Console.**

### 1. Lock down Firestore

1. Open https://console.firebase.google.com → your project (`timesheet-tracker-6792f`)
2. **Firestore Database** → **Rules** tab
3. Open `firestore.rules` (the file shipped alongside `index.html`)
4. **Replace everything** in the Firebase rules editor with the contents of that file
5. Click **Publish**

This guarantees that:
- No one can read or write another user's data, even if they sign in
- All payloads are validated server-side (date formats, numeric caps, string length limits)
- Any other database paths are blocked entirely

### 2. Disable user signup

1. In Firebase Console → **Authentication** → **Sign-in method** tab
2. Click **Email/Password** → toggle the **"User signup"** option (or "Allow new users") to **OFF**
3. Save

Existing users can still sign in. To create a new account in future, re-enable signup briefly, register, then disable it again.

### 3. Restrict your API key (optional but recommended)

1. Go to https://console.cloud.google.com → APIs & Services → Credentials
2. Find the Browser API key (the same `AIzaSy…` value that's in `index.html`)
3. Click it → **Application restrictions** → **HTTP referrers (websites)**
4. Add only:
   - `https://YOUR-USERNAME.github.io/*` (your GitHub Pages domain)
   - `http://localhost:*` (only if you test locally)
5. Save

Now even if someone copies the API key, browsers won't accept it from unauthorized domains.

---

## Deploying to GitHub Pages

The app is a single `index.html` file. Just commit it to your repo's main branch on the path GitHub Pages serves from (typically root or `/docs`). No build step.

```bash
# from the repo root
git add index.html firestore.rules README.md
git commit -m "Major update: USD, data tables, subscriptions, payslips, security"
git push
```

GitHub Pages will redeploy automatically. The `firestore.rules` and `README.md` files do not need to be served — they're just versioned alongside the code.

---

## How auto-features work

### Auto-filled timesheets
On every login, the app:
1. Finds your earliest existing timesheet entry (or 30 days ago if none)
2. Walks forward, week by week, up to last Sunday before today
3. For any Sunday with no entry, creates one with `reg=37.5, ot=0, auto=true`

These show with an "Auto" badge in the Status column. **Edit them like any other entry** — once edited, the `auto` flag is cleared and they'll show as Normal/Short/Long.

### Auto-generated subscription expenses
On every login, for each **active** subscription:
1. Walks from the subscription's start date (or 12 months ago, whichever is later) up to today
2. For each month, picks the chosen day-of-month — clamped to the last day of short months (Feb 30 → Feb 28/29, etc.)
3. Creates an expense entry tagged with `subId` so it's identifiable
4. Skips months where an entry already exists for that subscription on that date (idempotent)

To stop generation: click **Stop** on the subscription row. To resume: click **Resume**. To delete one specific charge (e.g. you canceled mid-month): just delete it from the Expenses tab — the subscription will not regenerate it because the date is already linked.

---

## Notes

- Date display is `en-US` (`Apr 25, 2026`)
- Database stores dates as `YYYY-MM-DD` strings, no timezone info
- All currency stored as JS numbers (in dollars). For perfect cent-precision in larger amounts, consider switching to integer cents in a future revision
- Auto-generated entries (timesheet & subscriptions) are **idempotent** — running the auto-process twice in a row will not create duplicates
