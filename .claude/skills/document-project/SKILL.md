---
name: document-project
description: Document a project (or single component) for DevDeck as a schema-conformant agent-docs entry. Full pipeline from minimal operator input to shipped commit. Triggers, "document this project", "add X to devdeck", "write agent-docs for Y".
---

# Document Project — DevDeck Pipeline (v2)

## Purpose

DevDeck is a portfolio of **structured, agent-consumable project documentation**. Its primary readers are MotherMind and the subagents it spawns. Ayden is a secondary reader who uses the same surface for personal quick-reference.

This skill produces a new data-only file at `src/content/agent-docs/{slug}.mdx` conformant to `docs/AGENT_DOCS_SCHEMA.md`. The file exposes its frontmatter through JSON endpoints (`/api/docs/{slug}.json` and `/api/docs/index.json`). There is no rendered HTML page at `/agent-docs/{slug}` — the human reading surface is a bespoke page under `/project*/`.

**This skill is NOT for:**
- Writing narrative/personal project stories — the agent-docs surface is structured data, not prose
- Updating pages under `/project1/*`, `/project2/*`, `/cheatsheet/*` — those live outside the agent-docs schema
- The B-framing About page (separate task)

---

## Operator input — minimal

```
/document-project --path=<absolute path to project or file> [--component=<component-name>]
```

- `--path` (required): absolute path. If it's a directory, the whole project is scoped. If it's a file or points at a specific module, that's a component-scoped run.
- `--component` (optional): explicit component label when the path is ambiguous (e.g. project root, but you want one subsystem documented).

**No brief conversation.** No emphasis / depth / voice questions. The orchestrator infers scope from the path and runs the pipeline.

Slug is auto-generated from the path basename (or component name), converted to kebab-case. Orchestrator may override if the slug is a collision or unclear — that's the only operator consultation before research.

---

## Pipeline

```
Phase 0  Scope detection                        [MotherMind direct]
         ├── infer scope (file → component; directory → project)
         ├── generate slug; confirm with operator ONLY if ambiguous
         └── write data/briefs/{slug}.json (minimal — path, slug, scope, kind)

Phase 1  Research                               [devdeck-research-agent]
         → data/research/projects/{slug}.json
         (scope respected; exploratory since the brief is minimal)

Phase 2  Schema fill                            [devdeck-content-agent]
         → src/content/agent-docs/{slug}.mdx
         frontmatter-only; no body, no layout, no title field

Phase 3  Validate                               [devdeck-validator-agent]
         → data/validation/{slug}-{timestamp}.json
         schema conformance + evidence resolution + command verification
         trivial issues auto-fixed in place
         non-trivial issues → halt pipeline, surface to operator

Phase 4  Integrate                              [devdeck-agent]
         ├── wire agentDocsSlug into the corresponding /project*/ bespoke page
         │   (set prop on DocsLayout and PageHeader — see docs/AGENT_DOCS_SCHEMA.md)
         │   If no bespoke page exists, create one or skip wiring (note in report)
         ├── npm run build — must pass clean
         └── report: files touched + build status

Phase 5  REVIEW                                 [HUMAN EDITORIAL GATE]
         Orchestrator presents:
         ├── bespoke page URL with agent badge (local dev or deployed preview)
         ├── /api/docs/{slug}.json output (the agent contract)
         └── validation report summary
         Operator approves OR requests revisions.
         Revisions loop back to Phase 2 with explicit feedback.

Phase 6  Ship                                   [devdeck-agent]
         ├── git add — explicit file list, NEVER -A or .
         ├── commit with Co-Authored-By: MotherMind <mothermind@mother.dev>
         └── git push origin main
         Vercel auto-deploys.
```

**Single human gate** — Phase 5 only. The brief conversation of the v1 skill is gone; research + content + validation produce a complete draft before the operator is pulled in.

---

## Schema contract

Every file produced by this skill MUST conform to `docs/AGENT_DOCS_SCHEMA.md` (current version: see header of that file).

The schema governs:
- Required frontmatter fields (identity, provenance, taxonomy, dependencies, commands, mechanisms, status, scope, related)
- File format: frontmatter only between `---` fences; no body, no `layout:` field, no `title:` field, no import lines
- `sourceRepo` must use `~/...` path convention
- JSON endpoint shape (per-page + corpus index)

If the schema evolves, validate existing files — no silent backwards-compatibility shims.

---

## Voice

Agent-docs files are structured data. The voice of the content is:

- **Third-person, factual, declarative.** "The activation flip wraps two UPDATEs in one transaction." NOT "I designed the activation to..."
- **Terse.** Research already produced claims; the page repeats them verbatim, doesn't embellish.
- **No marketing.** `tagline` is one factual sentence. No "blazingly fast" or "powerful".
- **No narrative.** No "why I built this", no "the journey from X to Y". Save narrative for the About page (separate task).

The file body is empty after the closing `---`. No prose. No component imports.

---

## Provenance

Every file carries (in frontmatter):
- `documentedBy: "MotherMind"` (or whoever orchestrated)
- `documentedAt: <ISO date of first generation>`
- `lastVerified: <ISO date of most recent research + validation pass>`

---

## Constraints

- **One project per run.** Never touch other projects' pages.
- **`src/content/agent-docs/` is the exclusive source location.** No files go into `src/pages/agent-docs/` (that directory no longer exists).
- **Schema-only content.** If research surfaces something that doesn't fit the schema, flag it in validation — don't invent new fields.
- **Never touch `.env`** or `secrets/`.
- **Single human gate** (Phase 5). No mid-pipeline approval prompts.
- **The two-repo quirk** — operate inside `apparent-astronaut/`. Parent `showcase-ast/` is a separate git repo and is not this skill's concern.
- **Explicit file list on commit.** `git add data/briefs/X data/research/projects/X.json src/content/agent-docs/X.mdx src/pages/project1/X.astro data/validation/X-*.json`. Never `-A` or `.`.

---

## Structured report back to orchestrator

Return this schema so MotherMind can log the run:

```json
{
  "projectSlug": "string",
  "scope": "project | component",
  "status": "success | partial | fail",
  "briefPath": "string (absolute)",
  "researchPath": "string (absolute)",
  "mdxPath": "string (absolute)",
  "validationReportPath": "string (absolute)",
  "commitSha": "7-char sha or null",
  "iterationsInReview": "number (how many Phase-5 loops)",
  "validationFlags": ["array of flag strings from validator"],
  "note": "one-sentence summary"
}
```

---

## Arguments (resume / retry)

```
/document-project --path=<path> [--component=<name>]   standard new run
/document-project --resume=<slug>                       resume mid-pipeline from last artifact
/document-project --revalidate=<slug>                   re-run Phase 3 only (useful when source code has changed)
```

Resume reads the last artifact on disk (`data/briefs/`, `data/research/projects/`, `src/content/agent-docs/`, `data/validation/`) and continues from the first missing stage.

Revalidate updates `lastVerified` if validation passes.
