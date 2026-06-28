# Blueprint — AI Product Manager

Turn a startup idea into a structured product blueprint in under 20 seconds. Paste your idea and get a business case (BRD), product spec (PRD), market analysis, and competitor deep-dive — all exportable as Markdown or PDF.

## Features

- **Blueprint generation** — BRD, PRD, and market intel generated in parallel via Gemini 2.5 Flash
- **Competitor deep-dive** — Live web research via Tavily, structured by Gemini
- **Refine & regenerate** — Update the full blueprint with a single sentence, or regenerate individual sections
- **Blueprint history** — All blueprints saved per user, accessible from the nav and profile page
- **Sharing** — Make any blueprint public and share it via a direct link
- **Export** — Download as Markdown or PDF

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Auth & database** — Supabase (Google OAuth + email/password, Row Level Security)
- **AI** — Vercel AI SDK with Google Gemini 2.5 Flash
- **Web search** — Tavily API
- **Styling** — Tailwind CSS + shadcn/ui

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
```

### 3. Set up the database

Run the following SQL in your Supabase project's SQL Editor:

```sql
create table public.blueprints (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references auth.users(id) on delete cascade not null,
  title           text,
  idea_input      text,
  brd             text,
  prd             text,
  market          text,
  competitor_data jsonb,
  is_public       boolean     not null default false,
  created_at      timestamptz not null default now()
);

alter table public.blueprints enable row level security;

create policy "select own"   on public.blueprints for select using (auth.uid() = user_id);
create policy "insert own"   on public.blueprints for insert with check (auth.uid() = user_id);
create policy "update own"   on public.blueprints for update using (auth.uid() = user_id);
create policy "delete own"   on public.blueprints for delete using (auth.uid() = user_id);
create policy "select public" on public.blueprints for select using (is_public = true);
```

### 4. Configure Supabase Auth

In your Supabase dashboard → Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback`

Enable Google as an OAuth provider under Authentication → Providers.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx                  # Landing page
  login/                    # Auth page (Google OAuth + email/password)
  app/                      # Main app (protected)
  profile/                  # User profile + blueprint history
  blueprint/[id]/           # Public blueprint viewer
  auth/callback/            # Supabase OAuth callback
  api/
    generate-blueprint/     # Blueprint generation + persistence
    blueprints/             # CRUD for saved blueprints
    deep-dive/              # Competitor research
    refine-blueprint/       # Full blueprint refinement
    regenerate-section/     # Single-section regeneration
components/
  blueprint/                # Blueprint UI components
  pdf/                      # PDF export
lib/
  supabase/                 # Server and browser Supabase clients
middleware.ts               # Auth route protection
```
