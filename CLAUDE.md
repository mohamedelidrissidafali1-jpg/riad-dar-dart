# CLAUDE.md — Riad Dar D'Art AI Assistant
## Instructions for Claude Code

---

## 🏨 What This Project Is

A guest-facing AI assistant for **Riad Dar D'Art** in Marrakech.
Guests scan a QR code, choose their language, and chat with the assistant during their stay.
The assistant helps with WiFi, breakfast, spa bookings, excursions, emergencies, and checkout.

This is a **live product** used by real guests. Stability is the top priority.

---

## 📁 Project Structure

```
index.html        ← ALL frontend: UI, styles, logic, translations (single file)
api/chat.js       ← Vercel serverless function — calls Anthropic API
vercel.json       ← Hosting config (do not touch)
```

---

## 🚫 NEVER TOUCH — Protected Systems

These are working correctly. Do NOT modify them under any circumstances:

### 1. Onboarding Flow
The 4-step flow is sacred:
`lang-screen` → `instruction-screen` → `save-screen` → `name-screen` → chat

- Do not add steps
- Do not remove steps
- Do not change the order
- Do not change how `selectLang()`, `enterSaveScreen()`, `enterNameScreen()`, `startChat()` work

### 2. Language System
- The `T` object contains ALL translations for 6 languages: `en`, `fr`, `es`, `it`, `de`, `ar`
- `selectedLangCode` and `selectedLang` control the active language
- The rule: **never mix languages** in a single session
- When adding any new text, you MUST add it to ALL 6 languages inside the `T` object
- Arabic (`ar`) uses RTL — always test direction when modifying UI

### 3. Session & localStorage
- `STORAGE_KEY` stores the full session: language, name, chat history, HTML
- Session expires after 7 days
- `saveSession()`, `loadSession()`, `clearSession()` — do not change their logic

### 4. Upsell System
- Time-based logic triggers spa suggestions based on time of day
- localStorage flags prevent the same upsell from showing twice
- Keys: `upsellShown`, `upsellFollowupShown`, `upsellFollowupTimer`
- Do not remove or reset these flags

### 5. Google Sheet Webhook
- Variable: `SHEET_WEBHOOK`
- Sends guest data silently on checkout
- Do not change the `sheetData` object structure (columns must stay the same)

### 6. WhatsApp Numbers
- `RECEPTION_WA` — used for bookings, alerts, and checkout summaries
- Do not change the message format of existing WhatsApp flows

### 7. Checkout & Survey
- `checkoutDone` flag locks the chat after checkout
- Survey ratings, comments, and the thank-you screen are complete — do not modify
- Low-rating alert goes to reception only

### 8. Quick Action Buttons (existing)
These 8 buttons are working — do not remove or rename them:
WiFi · Breakfast · Spa · Airport Taxi · Excursions · Find the Riad · Urgent Help · Checkout

---

## ✅ Safe To Modify

- Adding **new quick action buttons** (follow existing pattern)
- Adding **new screens** (follow the `onboarding-screen` or `action-card` pattern)
- Adding **new keys** to the `T` translation object (always add to ALL 6 languages)
- Adding **new localStorage keys** (use unique names, never overwrite existing keys)
- Improving **CSS styles** for new elements only
- Adding **new functions** that don't replace existing ones
- Updating `api/chat.js` system prompt text
- Adding new features to the **Excursions tab**

---

## 🛠️ How To Make Changes Safely

1. **One feature at a time** — never combine multiple changes in one task
2. **Read the full file before editing** — understand context first
3. **Add, don't replace** — extend existing logic, don't rewrite it
4. **Test the onboarding flow** after every change
5. **Test in all 6 languages** especially Arabic (RTL)
6. **Never delete existing CSS classes** — they may be used dynamically

---

## 🎨 Design System

- **Primary green:** `#1D9E75`
- **Dark green:** `#0F6E56`
- **Background:** `#f5f0e8`
- **Cards:** `#fff` with border `#ece9e2`
- **Font:** system-ui / -apple-system
- **Border radius:** 10–14px
- **Keep UI simple** — guests are non-technical, some are older

Button colors already defined:
- `.btn-green` — light green action
- `.btn-teal` — primary CTA
- `.btn-wa` — WhatsApp green `#25D366`
- `.btn-red` — urgent/cancel
- `.btn-maps` — Google Maps blue

---

## 🎯 Project Goals

**Short term (next 30 days):** Add features that bring value to guests AND riad owners:
- Restaurant recommendations (with commission potential for the riad)
- More excursion options
- Better owner-side reporting

**Long term:** Sell this assistant to 50–100+ riads in Marrakech.
Each riad gets their own version with their name, logo, WhatsApp number, and content.

---

## ⚠️ Important Reminders

- This is a **live system** — real guests use it daily
- The owner is **not a developer** — keep code clean and well-commented
- When in doubt: **do less, not more**
- Always confirm with the owner before making structural changes
