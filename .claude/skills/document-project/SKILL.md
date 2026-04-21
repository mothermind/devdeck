---
name: document-project
description: Document a project for DevDeck portfolio (Ayden Choi's data-engineering showcase). Full pipeline — scope brief → research → draft → review → publish → validate → ship. Six phases, two human editorial gates, B-framing (agent-collaborative provenance is explicit). Triggers, "document this project", "add X to devdeck", "write devdeck page for Y", "document {project} for devdeck".
---

# Document Project — DevDeck Pipeline

Six phases across two human conversations (orchestrator + operator) plus several agent dispatches. The operator is Ayden Choi. The orchestrator is the invoking session — typically MotherMind.

## B-framing (baked-in minimums)

DevDeck operates in B-mode: agent-collaborative provenance is explicit but not forced. Every generated page must:

- Include `documentedBy: "MotherMind"` and `documentedAt: "YYYY-MM-DD"` in its frontmatter
- Render a footer credit line: "Docs maintained by MotherMind"
- Preserve Ayden's first-person voice for the project narrative — NOT MotherMind-as-narrator

Meta-notes about agent-drafting are allowed in prose where they add signal. They are NOT required on every page and should never crowd the project's own story.

## Arguments

```
/document-project <project-slug>            operate on an opted-in project from data/projects/manifest.json
/document-project --path=$HOME/WorkSpace/X  operate on a raw path (for first-time additions — adds to manifest in Phase 0)
/document-project --resume=<slug>           resume a run that stopped mid-pipeline (reads prior brief + research)
```

If no args are passed, orchestrator asks the operator which project to document.

---

## Phase 0 — Scope brief conversation (operator-facing)

The orchestrator converses with the operator to produce a `doc-brief.json`. This is a human editorial gate — do not proceed to Phase 1 without the operator's explicit approval of the brief.

Questions to resolve in conversation:

1. **What's the project?** Confirm slug, path, display name, one-line tagline.
2. **What's the doc style?** Pick ONE: `cli-first` | `architecture-first` | `narrative` | `showcase` | `balanced`. Discuss with reasoning — which fits THIS project?
3. **What's the depth?** `surface` | `intermediate` | `exhaustive`. Default lean: surface or intermediate; exhaustive is rare and expensive.
4. **What's the emphasis?** 2-5 things to highlight. Specific.
5. **What to skip?** Things not worth documenting for this portfolio's audience.
6. **How many pages?** Overview-only (1 page) vs multi-page (e.g. project landing + 2-3 sub-topics). Most projects = 1 page.
7. **Existing DevDeck pages to resemble / differ from?** For stylistic consistency or deliberate contrast. Reference `src/pages/project1/`, `src/pages/project2/`, etc.

Write the brief to:
`$HOME/WorkSpace/showcase-ast/apparent-astronaut/data/briefs/{project-slug}.json`

Schema:

```json
{
  "project": {
    "slug": "string",
    "path": "string (absolute)",
    "displayName": "string",
    "tagline": "string (one line)"
  },
  "docStyle": {
    "type": "cli-first | architecture-first | narrative | showcase | balanced",
    "depth": "surface | intermediate | exhaustive",
    "emphasis": ["array of specific things to highlight"],
    "skip": ["array of specific things to omit"]
  },
  "pages": [
    { "slug": "string", "purpose": "string" }
  ],
  "voice": {
    "framing": "B-agent-collaborative",
    "narrator": "ayden-first-person",
    "metaNotes": "allowed-where-useful"
  },
  "references": {
    "similarTo": ["existing page slugs to calibrate against"],
    "contrastWith": ["existing page slugs to deliberately differ from"]
  },
  "createdAt": "ISO-8601",
  "createdBy": "MotherMind"
}
```

Show the brief to the operator. Iterate until approved. Only then proceed to Phase 1.

---

## Phase 1 — Research (agent dispatch)

Dispatch `devdeck-research-agent` with:
- Target project path (from `brief.project.path`)
- Doc brief path

The agent reads the project scoped to the brief (respecting `docStyle.skip` and `docStyle.depth`), writes output to `data/research/projects/{slug}.json`.

Wait for the agent's report. If gaps are flagged in `gapsFromBrief`, surface them to the operator — the operator may need to provide direct context the repo can't reveal (e.g. "why did I pick Postgres" is often in Ayden's head, not in the code).

---

## Phase 2 — Draft (orchestrator writes directly in MVP)

For MVP, the orchestrator drafts content directly. Future: graduate to `devdeck-content-agent` if voice calibration becomes a bottleneck.

Steps:

1. Read the brief + research JSON.
2. Read `docs/STYLE_GUIDE.md` for token + component patterns.
3. Read 1-2 existing project pages (`src/pages/project1/` or `src/pages/project2/`) to calibrate voice + MDX structure.
4. Draft each page in MDX. Write to a working location:
   `data/drafts/{project-slug}/{page-slug}.mdx`

Frontmatter every page with at minimum:

```yaml
---
title: "..."
documentedBy: "MotherMind"
documentedAt: "YYYY-MM-DD"
layout: "..."  # match existing project pages
---
```

Voice: Ayden first-person for the project narrative. B-framing meta-notes allowed where useful, not required.

---

## Phase 3 — Review (operator-facing)

Surface the draft(s) to the operator. Walk through:

- **Voice alignment** — does this sound like Ayden, not like AI-generic?
- **Coverage** — all `brief.pages[]` addressed?
- **Style guide adherence** — tokens + components match STYLE_GUIDE?
- **Meta-note placement** — appropriate signal vs. over-the-top gimmick?
- **Technical accuracy** — commands, paths, claims all correct?

Iterate until the operator approves. Iteration is orchestrator ↔ operator; no agent re-dispatch needed in MVP.

This is the second human editorial gate. Do not proceed to Phase 4 without explicit approval.

---

## Phase 4 — Publish (agent dispatch)

Dispatch `devdeck-agent` (general Astro specialist) to integrate the approved draft:

1. Move draft from `data/drafts/{slug}/` to the Astro routes under `src/pages/{slug}/` (check existing pages for the routing convention — likely `src/pages/{slug}/index.mdx` or similar)
2. Update navigation (Sidebar component, Header dropdown, or TOC) if the page needs to appear there
3. Update dashboard entry if the project gets a dashboard card
4. Add the project to `data/projects/manifest.json` if not already there
5. Run `npm run build` — must pass clean
6. Report: files touched + build status

---

## Phase 5 — Validate (manual in MVP)

For MVP, validation is operator + orchestrator manual review:

- `npm run build` passed cleanly (no warnings regressed)
- Visit the local page via `npm run dev` — renders correctly
- Navigation includes the new page (click through to verify)
- Dashboard shows the new project (if applicable)
- Footer credit line is present on the new page
- Internal links inside the new page resolve
- `documentedBy` + `documentedAt` frontmatter propagated correctly

If any issues surface, loop back to Phase 4 with the findings.

Future: graduate to `devdeck-validator-agent` with Playwright-like navigation + click-through verification.

---

## Phase 6 — Ship (agent dispatch)

Dispatch `devdeck-agent` to commit + push:

```bash
cd $HOME/WorkSpace/showcase-ast/apparent-astronaut
git add data/briefs/{slug}.json data/research/projects/{slug}.json data/projects/manifest.json src/pages/{slug}/
# plus any nav / dashboard / layout files that were touched in Phase 4
git commit -m "$(cat <<EOF
docs: add {displayName} ({slug}) project showcase

{one-line summary of the project being documented}

Co-Authored-By: MotherMind <mothermind@mother.dev>
EOF
)"
git push origin main
```

Vercel auto-deploys on push.

---

## Structured report back to invoker

Return this schema for the caller (MotherMind) to log:

```json
{
  "projectSlug": "string",
  "status": "success | partial | fail",
  "briefPath": "string (absolute)",
  "researchPath": "string (absolute)",
  "draftPaths": ["array of absolute paths"],
  "publishedPages": ["array of src/pages paths"],
  "commitSha": "7-char sha or null",
  "iterationsInReview": "number (how many operator-feedback loops happened in Phase 3)",
  "gapsFlagged": ["array of gap strings from research"],
  "note": "one-sentence summary"
}
```

---

## Constraints

- **Two hard editorial gates:** brief approval (end of Phase 0), draft approval (end of Phase 3). Do NOT auto-proceed past either.
- **One project per run.** Never touch other projects' pages during a single invocation.
- **Respect `docStyle.skip`** throughout. If the brief says to skip something, it stays skipped.
- **Don't write meta-notes everywhere.** They should add signal, not clutter. When in doubt, omit.
- **Don't build the About page here.** The full B-framing About page is a separate task — this skill documents individual projects.
- **The two-repo quirk** — work inside `apparent-astronaut/` only. Parent `showcase-ast/` is a separate git repo and is not this skill's concern.
- **Never touch `.env`** or anything in `secrets/`.
