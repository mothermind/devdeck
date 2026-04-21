# DevDeck — Feature Reference

## Dashboard (Homepage)

- **Live database metrics** pulled from `db_stats.json` for PostgreSQL, S3, and DynamoDB
- **Unicode sparkline charts** (▁▂▃▄▅▆▇█) rendering row-count history inline
- **Pipeline status cards** for 13 stages with color-coded health indicators (ok / stale / old)
- **Last-run timestamps** per stage from `last_run_dates.json`
- **Dynamic number formatting** with locale strings, delta arrows (+/−), and size conversions (MB/GB)
- **Two-column metric layout**: PostgreSQL + S3 (left), S3 + DynamoDB (right)

## Navigation & Layout

- **Sticky header** with identity block, social links, and inline search
- **Fixed sidebar** (desktop) with section-grouped nav and active-state highlighting
- **Three-column DocsLayout** grid: sidebar · content · table of contents
- **Auto-generated Table of Contents** from h2–h4 headings with scroll-activated highlights
- **Responsive breakpoints**: sidebar collapses at 900px, TOC hides at 1380px

## Search

- **Client-side search dropdown** triggered by `⌘K` hotkey
- Filters across a hardcoded page index by label and section
- Keyboard-driven: arrow keys to navigate, Escape to close
- Click-outside and result-click dismiss behavior

## Project 1 — K-Beauty Data Pipeline Docs

- **Pipeline overview page** with stage-by-stage documentation
- **Hand-coded SVG pipeline diagram** (740×440px) with typed nodes (scraper, process, storage, API) and curated edge routing (straight lines, arcs, curves, outer loops)
- **Six dedicated subpages**: scrapers, sentiment analysis, ingredient embeddings, search trends, table manager, and pipeline overview

## Project 2 — Hypothesis Explorer

- **Interactive React island** (`client:load`) for zero-shot classification
- **Bilingual support**: English / Korean language toggle
- **Model selector**: two mDeBERTa-v3 variants for inference
- **Review source options**: preset samples or custom textarea input
- **Six hypothesis categories**: sentiment, satisfaction, skin-type, ingredients, texture, repurchase
- **Editable hypothesis text** per group
- **Async scoring** via `/api/analyze` proxy to HuggingFace Inference API (POST-only)
- **Results panel**: horizontal bar charts with percentage labels, highlight for max scores, star indicators

## API

- **`/api/analyze.ts`** — server-side proxy endpoint to HuggingFace zero-shot classification
- POST-only, pre-rendered disabled (`export const prerender = false`)
- Authenticated with `HUGGINGFACE_TOKEN` environment variable

## Code Blocks

- **Auto-injected copy-to-clipboard** on all `<pre>` elements
- Animated SVG icon state change on copy (clipboard → checkmark)

## Styling

- **No CSS framework** — hand-rolled CSS with custom properties
- **Dark-first design** (GitHub-inspired palette)
- **CSS custom properties**: `--bg`, `--surface`, `--border`, `--text`, `--accent`
- **Font stack**: DM Sans (headings), Fragment Mono (body), JetBrains Mono (code)
- **Layout tokens**: `--sidebar-w: 260px`, `--content-max: 900px`, `--header-h: 56px`

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Framework   | Astro v5.17.1           |
| Islands     | React v19               |
| Content     | MDX                     |
| Types       | TypeScript (strict)     |
| Inference   | HuggingFace API         |
| Database    | AWS RDS PostgreSQL      |
| Storage     | S3, DynamoDB            |
