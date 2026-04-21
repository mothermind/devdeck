# DevDeck — Project Guide

## Project Overview

DevDeck is a personal data engineering portfolio documenting a K-Beauty skincare analysis pipeline (scrapers → NLP → embeddings → search trends → API). It pairs a live metrics dashboard with MDX documentation and an interactive zero-shot classification demo.

**Naming**: the repo folder is `apparent-astronaut/` (Astro starter project name), but the site brand is **DevDeck**. Both names refer to the same project — use "DevDeck" in user-facing text, `apparent-astronaut` for filesystem paths.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Astro v5.17.1 (file-based routing) | default output (static-ish with SSR endpoints) |
| Islands | React 19 | via `@astrojs/react` |
| Content | MDX | via `@astrojs/mdx` |
| Language | TypeScript | strict mode |
| Styling | Hand-rolled CSS | no framework, CSS custom properties only |
| Hosting | Vercel | `@astrojs/vercel` adapter |
| Inference | HuggingFace API | zero-shot classification, two mDeBERTa-v3 variants |
| Data source | AWS RDS PostgreSQL, S3, DynamoDB | stats materialized to JSON at build/cron time |

---

## Commands

```bash
npm run dev       # localhost:4321
npm run build     # production build
npm run preview   # preview built site
npm run astro     # Astro CLI passthrough
```

No lint or test scripts are configured.

---

## Architecture

- **Routing**: file-based via `src/pages/` — `index.astro` (dashboard), `project1/` (pipeline docs), `project2/` (Hypothesis Explorer), `cheatsheet/`, `api/analyze.ts`.
- **Islands**: React components rendered with `client:load` directives. `HypothesisExplorer.tsx` lives in `src/components/` (the `src/islands/` directory exists but is empty — treat `src/components/` as the home for both static Astro and hydrated React).
- **Layouts**: `Base.astro` owns the `<html>`, fonts, design tokens, and global CSS. `DocsLayout.astro` provides the three-column grid (sidebar · content · TOC).
- **Data**: `src/data/db_stats.json` and `src/data/last_run_dates.json` are the sources of truth for dashboard metrics — refresh these files to update the dashboard.
- **MDX**: doc pages in `src/pages/project1/`, `project2/`, `cheatsheet/` are authored as `.mdx` and wrapped in `DocsLayout`.

---

## Features

Dashboard (live DB/S3/DynamoDB metrics + sparklines + pipeline stage cards), pipeline documentation with hand-coded SVG diagram, Hypothesis Explorer (bilingual zero-shot classification island), `/api/analyze` server endpoint (POST-only, `prerender = false`), global copy-to-clipboard on all `<pre>` blocks, `⌘K` search dropdown, auto-generated TOC with scroll-highlight.

See **`docs/FEATURES.md`** for the complete feature catalog.

---

## Design System

Hand-rolled CSS with design tokens defined as CSS custom properties in `src/layouts/Base.astro`. Single source of truth — never use raw hex except for status badges and diagram nodes.

**Current palette: light / calm ivory** (not dark — the older "GitHub-inspired dark" note in FEATURES.md is stale).

| Token | Value | Role |
|---|---|---|
| `--bg` | `#FAF6F0` | ivory page background |
| `--surface` | `#F0EBE3` | cards, surfaces |
| `--text` | `#1A1A1A` | primary text |
| `--text-muted` | `#555` | body |
| `--accent` | `#D4620A` | orange — interactive + active states |
| `--code-bg` | `#1A1A1A` | code blocks remain dark on the light page |

Fonts: DM Sans (headings), Fragment Mono (body/nav), JetBrains Mono (code).

See **`docs/STYLE_GUIDE.md`** for canonical tokens, component recipes, spacing scale, radius scale, and transitions.

---

## Environment

`.env` (gitignored) — required for production/API routes:

- `DATABASE_URL` — AWS RDS PostgreSQL connection string
- `HUGGINGFACE_TOKEN` — used by `/api/analyze` to call HuggingFace Inference API

---

## Key Conventions

- **Match design tokens**. When adding UI, use tokens from `Base.astro` — don't introduce new hex values unless they're status colors or diagram nodes (both enumerated in `docs/STYLE_GUIDE.md`).
- **Responsive**: desktop-first. Sidebar collapses at `900px`, TOC hides at `1380px`.
- **Content max-width**: `900px` default (`--content-max`), `1100px` for the dashboard (`showToc={false}`).
- **No CSS framework** — resist the urge to add Tailwind or similar.
- **Code blocks** get copy buttons automatically via the global script in `Base.astro` — just use standard Markdown/MDX fenced code.
- **Korean-friendly**: no Tailwind-class CJK breaks needed; base fonts and line-height (`1.8`) handle it.

---

## Hosting / Deployment

- Deployed via **Vercel** (`@astrojs/vercel` adapter in `astro.config.mjs`).
- Output mode is Astro default (not explicitly set) — static pages with SSR for `/api/analyze`.
- No `site` field set in `astro.config.mjs` — production URL is whatever Vercel assigns to the project.

---

## Repo Structure Note

Two nested git repos with **independent histories** — do not assume `git log` in one reflects the other:

- `~/WorkSpace/showcase-ast/` (parent) — a workspace-level repo holding meta-docs. Historically tracked `FEATURES.md` / `STYLE_GUIDE.md` here; those are now migrated into `apparent-astronaut/docs/` and deleted from the parent.
- `~/WorkSpace/showcase-ast/apparent-astronaut/` — the actual Astro app. This is the deployed codebase.

When running `git status` or `git log` for DevDeck work, operate inside `apparent-astronaut/`. The parent repo is effectively an empty shell post-cleanup.
