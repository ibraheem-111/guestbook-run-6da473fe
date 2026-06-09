# Guestbook — Product Requirements Document

## 1. Product Thesis

A lightweight, public guestbook web application where any visitor can leave their name and a short message. Entries are displayed in a single-page list sorted newest-first. The UI is intentionally minimal and clean to reduce friction and put focus on the messages themselves.

## 2. Users & JTBD

**Primary user:** Any web visitor (no account required).

**Job-to-be-done:**
- *When I* visit the guestbook page, *I want to* leave my name and a message, *so that* my voice is recorded and visible to others.
- *When I* view the page, *I want to* read what others have written, *so that* I feel part of a shared space.

## 3. Journeys

### 3.1 Happy Flow (primary — Playwright gate target)
1. User loads the guestbook page.
2. User sees existing entries sorted newest-first (or an empty-state welcome).
3. User enters their name in the "Name" field.
4. User enters a short message in the "Message" field.
5. User clicks the "Submit" button.
6. The new entry appears instantly at the top of the list with name, message, and timestamp.

### 3.2 Empty State
1. First-time visitor loads the page with zero entries.
2. A friendly empty-state message invites them to be the first to sign.

### 3.3 Validation Error
1. User clicks "Submit" with an empty name or empty message.
2. Inline validation highlights the missing field(s) without clearing the other input.

## 4. Competitor Landscape

| Product | URL | Key Features | Gaps (our opportunity) |
|---------|-----|--------------|------------------------|
| UltraGuest | https://www.ultraguest.com | Free customizable guestbook since 2003; spam filtering; edit/delete messages; GuestMaps; smilies; admin panel. | Heavy feature set, dated UI, requires signup. |
| DigiGuestbook | https://digiguestbook.com | Event-focused digital guestbook; collects messages, photos, and audio; live display at events; keepsake preservation. | Paid tiers required for many features; overkill for a simple web guestbook. |
| Guestbook.me | https://guestbook.me | Simple embeddable iframe widget; no signup; lightweight; auto-deletes old messages weekly. | iframe-only, no standalone page, no persistent history, minimal styling. |

**Our differentiation:** Zero signup, zero friction, a single beautiful standalone page, and persistent history — the sweet spot between "too bare" (Guestbook.me) and "too heavy" (UltraGuest / DigiGuestbook).

## 5. MVP Scope

### In scope
- Single-page guestbook at root (`/`).
- Input form: Name (text, max 60 chars, required) + Message (textarea, max 500 chars, required).
- Real-time client-side validation before submit.
- Submit entry → server-side persistence.
- Entries list rendered server-side or via lightweight client fetch, sorted newest-first.
- Each entry shows: name, message, human-readable timestamp (e.g. "2 hours ago" or absolute date).
- Empty-state copy when no entries exist.
- Subtle entry entrance animation on page load and after new submission.
- Responsive layout (mobile, tablet, desktop).

### Out of scope
- User accounts / authentication.
- Edit or delete entries after submission.
- Admin moderation panel.
- Spam filtering (for MVP; rely on rate-limiting).
- Photo / audio / file uploads.
- Embeddable widget / iframe mode.
- Search or pagination (MVP assumes <1,000 entries; simple scroll).

## 6. Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F1 | Submit entry | Name + message form with validation | P0 |
| F2 | Display entries | List with name, message, timestamp | P0 |
| F3 | Sort newest-first | Entries ordered by created_at DESC | P0 |
| F4 | Empty state | Friendly message when no entries | P0 |
| F5 | Responsive layout | Works on mobile, tablet, desktop | P0 |
| F6 | Entrance animations | Subtle fade/slide-in on entries | P1 |
| F7 | Timestamp formatting | Relative or absolute time display | P1 |

## 7. Non-Functional Requirements

- **Performance:** Page load < 1.5s on 3G; form submit → feedback < 300ms perceived.
- **Accessibility:** Keyboard-navigable, proper label associations, color-contrast ≥ WCAG AA.
- **Security:** Server-side input sanitization (XSS prevention), basic rate-limiting on submit (e.g., 5 req/min/IP).
- **Browser support:** Latest Chrome, Firefox, Safari, Edge; mobile Safari & Chrome.
- **Uptime:** Tied to platform (Railway).

## 8. Acceptance Criteria

### AC-1: Entry submission
**Given** the guestbook page is loaded and has 0 existing entries,  
**When** the user enters "Alex" in the Name field, "Hello world!" in the Message field, and clicks Submit,  
**Then** a new entry appears at the top of the list displaying "Alex", "Hello world!", and a timestamp,  
**And** the Name and Message inputs are cleared.  
**Verification:** Playwrighthappy-flow test (see §3.1).

### AC-2: Validation
**Given** the guestbook page is loaded,  
**When** the user clicks Submit with either Name or Message empty,  
**Then** the form does not submit,  
**And** the empty field(s) are visually highlighted with an inline error.  
**Verification:** Playwright validation-error test.

### AC-3: Sort order
**Given** there are at least 2 entries,  
**When** the page is loaded or refreshed,  
**Then** the most recently submitted entry appears first.  
**Verification:** Playwright assertion on DOM order after multiple submissions.

### AC-4: Empty state
**Given** there are zero entries in the database,  
**When** the page is loaded,  
**Then** a friendly empty-state message is displayed instead of a blank list.  
**Verification:** Playwright snapshot or text presence check.

### AC-5: Responsiveness
**Given** the guestbook page is loaded,  
**When** the viewport is resized to 375px × 667px (mobile),  
**Then** the form and list are fully visible without horizontal scroll and remain usable.  
**Verification:** Playwright screenshot diff or viewport resize + accessibility check.

## 9. Visual Design Guidance

### Aesthetic: Refined Editorial Minimalism
- **Palette:** Paper background `#FDFBF7`, deep walnut text `#2C231E`, warm gray accents `#8C857B`, subtle divider `#E8E4DE`, accent moss `#6B8E6B`.
- **Typography:** Cormorant Garamond (display, elegant serif) for the page title; Source Sans 3 (body, clean sans) for form and entries. Loaded via Google Fonts or `next/font`.
- **Spacing:** Generous whitespace (64px outer padding on desktop, 24px on mobile). Entry cards separated by 32px vertical gap with a hairline divider.
- **Motion:** Entries fade in + translate Y (`opacity 0→1, translateY 12px→0`) with `0.3s cubic-bezier(0.4, 0, 0.2, 1)`. Newest entry animates with an additional subtle spring-like scale.
- **Form:** Minimal outlined inputs with warm gray border, focused state deep walnut border. Submit uses a subtle filled pill button.

## 10. Ticket Seeds

- seed: setup repo + Next.js 14 + TypeScript + Tailwind
- seed: design database schema (guestbook_entries) on Supabase
- seed: build guestbook form component with validation
- seed: build entries list component with sort + timestamp
- seed: wire up Supabase CRUD (insert + select)
- seed: implement empty state
- seed: add responsive layout polish
- seed: entry entrance animations
- seed: deploy to Railway + connect custom domain
