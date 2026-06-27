# Blueprint Generator — UI/UX Flow Specification

> Reference document for Claude Code implementation.
> Decisions are final unless marked `[OPEN]`.

---

## Overview

A single-page app with four distinct states. No routing — state is managed in memory and the UI transitions between views. The entire experience lives on one URL.

**States in order:**
1. Brain Dump — idea input
2. Engine Room — generation progress
3. Blueprint Dashboard — results viewer
4. Export — download and share

---

## Tech decisions

| Decision | Choice | Notes |
|---|---|---|
| Generation approach | Checklist (no streaming) | Standard API call; checklist runs on a fixed timer to simulate progress |
| Dashboard layout | Left sidebar | Collapsible — see sidebar spec below |
| Advanced input | Accordion (collapsed by default) | Keeps first load clean |
| File export | Markdown `.md` | Merges all three sections into one file |

---

## Screen 1 — Brain Dump

**Purpose:** Get the user's idea with minimum friction.

### Layout

- Full-page centered layout, no sidebar
- Single large `<textarea>` dominates the center
- Max content width: `540px`, vertically and horizontally centered

### Elements

**Hero copy** (above textarea)
- Eyebrow label: `"Start here"` — small, muted, uppercase
- Heading: `"What are you building?"` — 22px, weight 500
- Subtext: `"Describe your idea in plain language — who it's for, the problem it solves, and how it makes money."` — 14px, muted

**Textarea**
- Placeholder: `"e.g. A subscription app for indie founders that tracks SaaS metrics and sends weekly digest emails. Targets solo developers, monetised via $12/mo subscription..."`
- Min height: `130px`, resizable vertically
- Full width of the content column

**Advanced accordion** (below textarea)
- Trigger label: `"Add target audience and monetisation details"` with a chevron icon
- Collapsed by default
- On expand, reveals three optional fields:
  - `Target audience` — placeholder: `"e.g. Solo developers, indie hackers aged 25–40"`
  - `Monetisation model` — placeholder: `"e.g. Freemium with $12/mo Pro tier"`
  - `Competitors (optional)` — placeholder: `"e.g. Baremetrics, ChartMogul"`
- Fields sit inside a lightly tinted container with a subtle border
- Chevron rotates 180° when expanded

**CTA button**
- Label: `"Generate blueprint →"`
- Accent-filled, right-aligned below the accordion
- On click: validates textarea is non-empty, then transitions to Screen 2

### Behaviour

- Textarea must have content to enable the CTA (show inline hint if empty on submit: `"Add a description to continue"`)
- Advanced fields are all optional — never block submission

---

## Screen 2 — Engine Room

**Purpose:** Keep the user engaged during the 15–20 second API call.

### Layout

- Same full-page centered layout as Screen 1
- Textarea transitions out; checklist fades in
- Max content width: `360px`

### Elements

**Header copy**
- Eyebrow: `"Generating your blueprint"` — muted, small
- Subhead: `"This usually takes 15–20 seconds"` — 18px, weight 500

**Progress checklist**

Four steps rendered as a vertical list. Each step has:
- A status dot (left)
- Step name (bold, 13px)
- Step description (muted, 12px, one line)

| Step | Name | Description |
|---|---|---|
| 1 | Analysing your idea | Extracting problem, audience, and value prop |
| 2 | Structuring business logic | Revenue model, risks, go-to-market |
| 3 | Writing user stories | Epics, acceptance criteria, edge cases |
| 4 | Researching market | Competitive landscape and TAM |

**Dot states:**

| State | Appearance |
|---|---|
| `done` | Filled success-tinted circle with a checkmark icon |
| `active` | Accent-tinted circle with a pulsing ring animation (`@keyframes pulse` opacity 1 → 0.3 → 1`) |
| `pending` | Empty neutral circle with a hairline border |

**Step timing** (runs on a fixed interval after API call begins):
- Step 1 → `done` at `t=0` (immediately)
- Step 2 → `active` at `t=0`, `done` at `t=5s`
- Step 3 → `active` at `t=5s`, `done` at `t=11s`
- Step 4 → `active` at `t=11s`, `done` when API response arrives

If API responds faster than the animation, hold on the last active step until the response is received, then mark done and transition to Screen 3.

### Transition to Screen 3

- Automatic on API response received
- Brief 400ms delay after final step marks `done`, then fade-transition to dashboard

---

## Screen 3 — Blueprint Dashboard

**Purpose:** Display the generated blueprint in a readable, structured format.

### Layout

- Full-width two-column layout: collapsible left sidebar + content area
- Sidebar default state: **expanded** (200px wide)
- Sidebar collapsed state: **icon-only** (48px wide)
- Content area fills remaining width

### Sidebar

**Header:** Section label `"Blueprint"` — 11px, uppercase, muted

**Navigation tabs (3 items):**

| Tab | Icon | Label |
|---|---|---|
| 1 | `briefcase` | Business case |
| 2 | `layout-list` | Product specs |
| 3 | `chart-bar` | Market intel |

Tab active state: left border accent (`2px solid --border-accent`), accent text color, light accent background tint.

**Collapse toggle:**
- A small icon button (`chevrons-left` / `chevrons-right`) pinned to the bottom of the sidebar, above the action buttons
- On click: sidebar animates to 48px wide; tab labels hide, only icons remain centered
- Toggle icon flips to `chevrons-right` when collapsed
- Tooltip on hover in collapsed state showing the tab name

**Bottom actions (above collapse toggle):**

| Button | Icon | Label | Action |
|---|---|---|---|
| Export | `share` | Export | → Screen 4 |
| Start over | `refresh` | Start over | → Screen 1, clears state |

In collapsed sidebar mode, these show icon-only.

### Content area

**Toolbar** (top of content area, full width):
- Left: current tab name (e.g. `"Business case (BRD)"`) — 13px, weight 500
- Right: `"Copy"` button — copies the active tab's markdown to clipboard

**Content panels (one per tab):**

All content is rendered Markdown — headings, paragraphs, tag pills, and metric cards. Panels are swapped on tab click; no page reload.

---

#### Panel 1 — Business case (BRD)

Sections to render:

1. **Document title** + tag pills (e.g. `SaaS`, `Subscription`, `High viability`)
2. **Problem statement** — 2–3 sentence paragraph
3. **Value proposition** — 2–3 sentence paragraph
4. **Revenue model** — paragraph describing tiers, pricing, annual option
5. **Key risks** — risk tag pills + a paragraph on mitigation
6. **Metric cards row** (3 cards): `Target TAM`, `Break-even MRR`, `Target payback`

---

#### Panel 2 — Product specs (PRD)

Sections to render:

1. **Document title** + tag pills (e.g. `MVP scope`, `N epics`)
2. **Epic 1 — [name]** — user story format: "As a [role], I want to [action] so that [outcome]." followed by acceptance criteria
3. **Epic 2 — [name]** — same format
4. **Epic 3 — [name]** — same format

Number of epics is dynamic based on API response. Aim for 3–5 for an MVP.

---

#### Panel 3 — Market intel

Sections to render:

1. **Document title** + tag pills (e.g. `Competitive analysis`, `Blue ocean signals`)
2. **Competitive landscape** — named competitor analysis in paragraph form
3. **Positioning opportunity** — 2–3 sentences on the gap to exploit
4. **Metric cards row** (3 cards): `Avg competitor price`, `Price gap`, `Known competitors`

---

### Tag pill styles

| Variant | Background | Text | Border | Use case |
|---|---|---|---|---|
| Default (blue) | accent-tinted | accent | accent | Category labels |
| Green | success-tinted | success | success | Positive signals |
| Amber | warning-tinted | warning | warning | Risk / caution flags |

---

### Metric cards

- 3-column grid
- Each card: light neutral background, `--radius` corners, 12px 14px padding
- Label: 11px, muted, above
- Value: 18px, weight 500, primary text

---

## Screen 4 — Export

**Purpose:** Let the user take the blueprint out of the app.

### Layout

- Same centered layout as Screen 1
- Max content width: `440px`

### Elements

**Header copy**
- Eyebrow: `"Export your blueprint"`
- Heading: `"Take it anywhere"`
- Subtext: `"All three sections merged into one clean file, ready for Notion, Obsidian, or Linear."`

**Export action cards (3 items, stacked vertically):**

Each card is a full-width button with a left icon, a bold label, and a muted description line.

| Icon | Label | Description | Action |
|---|---|---|---|
| `download` (accent) | Download full Markdown | BRD + PRD + Market intel as one `.md` file | Triggers file download |
| `copy` (neutral) | Copy active tab to clipboard | Paste directly into any doc editor | Copies current tab markdown |
| `brand-notion` (neutral) | Open in Notion | Push blueprint directly to a new Notion page | Opens Notion import URL |

**Bottom row (two equal buttons):**
- `← Back to dashboard` → Screen 3
- `↺ New blueprint` → Screen 1, clears all state

---

## Global elements

### Top navigation bar (persistent)

Present on all screens.

**Left:** App logo — icon (`topology-star-3`) + wordmark `"Blueprint"` — 14px, weight 500

**Right (changes per screen):**

| Screen | Right content |
|---|---|
| 1, 2, 4 | Step indicator: `"Step N of 4"` — 12px, muted |
| 3 | Step indicator + `"Export →"` accent button |

---

## State management

All state is in-memory (no localStorage, no backend persistence).

| State key | Type | Description |
|---|---|---|
| `ideaInput` | `string` | Raw textarea content |
| `targetAudience` | `string` | Optional advanced field |
| `monetisationModel` | `string` | Optional advanced field |
| `competitors` | `string` | Optional advanced field |
| `generatedBRD` | `string` | Markdown string from API |
| `generatedPRD` | `string` | Markdown string from API |
| `generatedMarket` | `string` | Markdown string from API |
| `activeTab` | `'brd' \| 'prd' \| 'market'` | Currently selected dashboard tab |
| `sidebarCollapsed` | `boolean` | Sidebar collapse state |
| `currentScreen` | `1 \| 2 \| 3 \| 4` | Active screen |

---

## Transitions and animation

| Transition | Behaviour |
|---|---|
| Screen 1 → 2 | Textarea fades out (200ms), checklist fades in (200ms) |
| Screen 2 → 3 | 400ms delay after final step, then cross-fade to dashboard (300ms) |
| Screen 3 → 4 | Instant or 150ms fade |
| Sidebar collapse | Width animates from 200px → 48px over 200ms (`transition: width 0.2s ease`) |
| Tab switch | Panel fades in (150ms) |
| Checklist steps | Each dot state change animates (scale 0.8 → 1.0, 150ms) |
| Accordion expand | Height animates open (`max-height` transition, 200ms) |

---

## Markdown export format

When "Download full Markdown" is triggered, merge all three panels in this order with dividers:

```
# Blueprint: [App Idea Title]
Generated on [date]

---

## Business case (BRD)

[BRD content]

---

## Product specs (PRD)

[PRD content]

---

## Market intel

[Market content]
```

Filename: `blueprint-[slugified-idea-title]-[YYYY-MM-DD].md`

---

## API prompt structure (for reference)

The single API call on Screen 2 should return structured content for all three sections. Prompt the model to return JSON with three keys: `brd`, `prd`, `market`. Each is a Markdown string.

Example response shape:

```json
{
  "brd": "## Problem statement\n\n...",
  "prd": "## Epic 1 — Onboarding\n\n...",
  "market": "## Competitive landscape\n\n..."
}
```

Parse the JSON response and store each value in state before transitioning to Screen 3.

---

## Out of scope (v1)

- User accounts or authentication
- Saving/loading past blueprints
- Sharing via URL or link
- Editing generated content inline
- Dark mode toggle (use system preference via `prefers-color-scheme`)
- Mobile layout optimisation (desktop-first for v1)
