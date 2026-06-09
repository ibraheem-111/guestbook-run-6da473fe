# Build Plan — Guestbook App (run-6da473fe)

## Approach

Build a minimal Node.js/Express monolith serving a single-page guestbook frontend from `public/`, backed by a Supabase PostgreSQL database. All work is done directly on `main` via PRs that merge automatically if green.

## Architecture Decisions

- **Backend**: Express (Node.js) per architecture.md — single service on Railway.
- **Frontend**: Static SPA (`public/index.html`, `public/style.css`, `public/app.js`) served by Express. No Next.js / Vercel — the architecture explicitly says "one compute service."
- **Database**: Supabase PostgreSQL via `@supabase/supabase-js` (POSTGRESQL driver, not REST). Provisioned via Supabase MCP.
- **No mock dependencies** — Supabase is PROVISION VIA MCP. No third-party APIs needed.
- **Rate limiting**: In-memory SQLite-backed store (in `server.js`) for 3 req/hour/IP — good enough for MVP.

## Dependency Dispositions

| Variable | Disposition |
|----------|-------------|
| SUPABASE_URL | **PROVISION VIA MCP** |
| SUPABASE_SERVICE_ROLE_KEY | **PROVISION VIA MCP** |
| OPENROUTER_API_KEY | Already in env (not used by this app — no AI features) |
| NEXTAUTH_SECRET | Not needed (no auth) — skip |
| NEXTAUTH_URL | Not needed — skip |

## Wave / Ticket Order

### Wave 1 — Scaffold
1. **Ticket 1**: Set up project scaffold and web server (`package.json`, `server.js`, `public/`)

### Wave 2 — API + Data
2. **Ticket 2**: Implement `GET /api/entries` (list from Supabase)
3. **Ticket 3**: Implement `POST /api/entries` (create in Supabase)
4. **Ticket 4**: Server-side validation & sanitization (1–100 name, 1–500 message, DOMPurify-style escape)
5. **Ticket 5**: Honeypot + IP-hash rate limit (3/hour)

### Wave 3 — Frontend + Polish
6. **Ticket 6**: Create guestbook page (`public/index.html`, `app.js`) — form + list wired to API
7. **Ticket 7**: Client-side validation (HTML5 required, char counters, JS length checks)
8. **Ticket 8**: Empty state message when no entries
9. **Ticket 9**: Styling with PRD aesthetic (`#FDFBF7` bg, `#0A0A0A` text, Space Mono, 640px max-width)
10. **Ticket 10**: Responsive mobile layout (viewport meta, media query, min 44px tap targets)

## Happy Flow (Playwright gate target)

1. Visit the live deployed URL.
2. Assert empty-state message is present (fresh DB).
3. Fill name = "Alex", message = "Hello world!", click Submit.
4. Assert new entry appears at top with name "Alex", message "Hello world!", and a timestamp.
5. Assert inputs are cleared.
6. Refresh page — entry still present.

## Deploy Path

1. **Preflight**: `npm audit` → patch HIGH/CRITICAL.
2. **Supabase MCP**: Create project, get URL + anon + service-role key.
3. **Railway MCP**: Create service `sf-run-6da473fe`, set all env vars, deploy.
4. **Generate domain** on Railway.
5. **Finite health-wait** (max 20 attempts, 15s apart).
6. **Playwright gate** on live domain.

## Build-Time Env Placeholders

Since Railway service vars are runtime-only, the Dockerfile will include placeholder `ENV` entries for any module-load client. In our case, Supabase client is constructed lazily inside route handlers, so no build-time placeholders needed. The Dockerfile still ships per the proven pattern.

## Risk Mitigation

- If `npm audit` finds unfixable HIGH/CRITICAL: accept risk and document.
- If Supabase MCP fails: record blocker, escalate.
- If Railway deploy fails: read build/deploy logs, fix, redeploy (recorded as logical fix agent).
