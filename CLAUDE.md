@AGENTS.md

# Blueprint — Codebase Guide

AI-powered product blueprint generator. Users sign in, describe a startup idea, and get a BRD, PRD, market analysis, and competitor deep-dive. Blueprints are saved per user and can be shared publicly.

---

## Routes

| Path | Description |
|---|---|
| `/` | Landing page (unauthenticated) |
| `/login` | Auth page — Google OAuth + email/password |
| `/app` | Main app — protected, requires auth |
| `/profile` | Blueprint history + account — protected |
| `/blueprint/[id]` | Public blueprint viewer — no auth required |
| `/auth/callback` | Supabase OAuth/email-confirmation code exchange |

Middleware at `middleware.ts` enforces auth on `/app` and `/profile`. The `/auth/callback` route is excluded from the matcher so it can run before session is established.

---

## Auth pattern

Uses `@supabase/ssr` with PKCE. Two Supabase clients:

- **`lib/supabase/client.ts`** — browser client (`createBrowserClient`). Use in `"use client"` components.
- **`lib/supabase/server.ts`** — server client (`createServerClient` with `cookies()`). Use in API routes and Server Components.

Never use the browser client in API routes. Never use the server client in client components.

All OAuth and email-confirmation redirects go through `/auth/callback`, which calls `exchangeCodeForSession` before redirecting to `/app`.

---

## Database

Single Supabase table: `blueprints`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | References `auth.users`, cascade delete |
| `title` | text | First 60 chars of `idea_input` |
| `idea_input` | text | Raw user input |
| `brd` | text | Markdown |
| `prd` | text | Markdown |
| `market` | text | Markdown |
| `competitor_data` | jsonb | Array of `CompetitorRow` (nullable) |
| `is_public` | boolean | Default false |
| `created_at` | timestamptz | Default now() |

RLS is enabled. Users can only read/write their own rows. Public blueprints (`is_public = true`) are readable by anyone.

Types live in `lib/types.ts`.

---

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/generate-blueprint` | POST | Generate BRD+PRD+market via Gemini, persist to Supabase, return `blueprintId` |
| `/api/blueprints` | GET | Paginated list of current user's blueprints |
| `/api/blueprints/[id]` | GET / PATCH / DELETE | Single blueprint CRUD |
| `/api/deep-dive` | POST | Competitor research — actions: `extract`, `search`, `save` |
| `/api/refine-blueprint` | POST | Rewrite all three sections with a user instruction |
| `/api/regenerate-section` | POST | Regenerate one tab (brd / prd / market) in isolation |

All API routes use the server Supabase client and verify the user before touching the database.

---

## AI

Vercel AI SDK (`ai` package) with `@ai-sdk/google` (Gemini 2.5 Flash). `generateObject` is used everywhere structured output is needed. `generateText` is used for the competitor name extraction step in `/api/deep-dive`.

Web search for competitor deep-dive uses the Tavily API (`@tavily/core`).

---

## App state

The main app (`app/app/page.tsx`) is a single client component managing all UI state in memory via `useState`. There is no client-side router — screen transitions are handled by a `currentScreen: 1 | 2 | 3 | 4` value. Blueprints are fetched from Supabase on generation and on history load; nothing is persisted to localStorage.

---

## Key conventions

- The `generate-blueprint` route wraps the Supabase insert in a non-fatal try/catch — a failed save must never block the API response.
- The history dropdown always fetches the **full** blueprint record (`/api/blueprints/${id}`) when a user selects one — the list endpoint only returns summary fields.
- The `blueprintId` returned from `/api/generate-blueprint` is stored in app state and used for subsequent PATCH calls (public/private toggle, competitor data save).
