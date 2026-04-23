# Agent Docs Schema

**Version:** 0.2 (data-only, discoverability added)
**Last updated:** 2026-04-23
**Maintainer:** MotherMind

---

## Changelog

| Version | Date | Summary |
|---|---|---|
| 0.1 | 2026-04-21 | Pilot — frontmatter + PageSchema renderer + `/agent-docs/{slug}` HTML routes |
| 0.2 | 2026-04-23 | Data-only architecture: mdx moved to `src/content/`, HTML routes removed, discoverability layer added (`/llms.txt`, `<link rel="alternate">`, visible badge), `sourceRepo` normalized to `~/...` convention |

---

## Purpose

DevDeck's primary readers are **MotherMind and the subagents it spawns**. Ayden is a secondary reader using the same surface for personal quick-reference and portfolio display. No other audience exists today.

This document defines the page format optimized for the primary audience: **structured, parseable, grep-friendly, self-contained.** Human-readable polish is a rendering layer on the `/project*/` bespoke pages, not the source of truth.

**Scope of this schema:** files under `src/content/agent-docs/`. Pages under `/`, `/project1/*`, `/project2/*`, `/cheatsheet/*` are NOT governed by this schema.

---

## Consumer contract

Agents consume agent-docs content through three surfaces:

| Surface | URL pattern | Returns |
|---|---|---|
| Corpus index | `GET /api/docs/index.json` | Array of `{ slug, kind, tagline, tags, status.stage }` for every agent-docs entry |
| Per-page data | `GET /api/docs/{slug}.json` | Full frontmatter of the requested entry as JSON |
| Human view | `/project1/{slug}` or `/project2/{slug}` | Bespoke narrative page (no longer at `/agent-docs/{slug}`) |

**The JSON endpoints are the canonical surface.** When a subagent needs a command or a mechanism, it fetches the JSON.

---

## Discoverability

Three surfaces ensure agents can find the JSON regardless of entry point.

### 1. `/llms.txt` — site-wide agent directory

`GET /llms.txt` returns a plain-text machine-readable directory listing all subsystems and human pages. Format follows the emerging `llms.txt` convention. An agent discovering the site for the first time should start here.

### 2. `<link rel="alternate">` in bespoke page heads

Every bespoke project page that has a corresponding agent-docs JSON carries:

```html
<link rel="alternate" type="application/json" href="/api/docs/{slug}.json" title="Agent-readable spec (JSON)" />
```

This allows an agent that fetches a human page to immediately discover the structured JSON URL from the `<head>`.

### 3. Visible agent-readable badge on bespoke pages

`PageHeader` renders a muted footnote link when `agentDocsSlug` is set:

```
🤖 Agent-readable: /api/docs/{slug}.json
```

Visible to both humans and agents rendering the page.

---

## File layout

```
src/content/agent-docs/{slug}.mdx        ← data-only: frontmatter is the contract, no body
src/pages/api/docs/[slug].json.ts        ← per-page JSON endpoint (SSR)
src/pages/api/docs/index.json.ts         ← corpus index endpoint (SSR)
src/pages/llms.txt.ts                    ← site-wide agent directory (SSR)
```

The mdx files live in `src/content/` — outside `src/pages/`, so Astro does not generate HTML routes for them. `import.meta.glob` still exposes their `frontmatter` for the JSON endpoints.

---

## Frontmatter schema

Every agent-docs file MUST carry this frontmatter structure. Fields marked **required** cannot be omitted. Empty arrays (`[]`) are valid and mean "no entries"; missing fields are a schema violation.

```yaml
---
# --- IDENTITY (required) ---
slug: string                    # matches filename; URL-safe kebab-case
kind: cli-component | cli-tool | pipeline | service | reference
displayName: string             # human-friendly name
tagline: string                 # one line, no period if possible

# --- PROVENANCE (required) ---
documentedBy: string            # "MotherMind" for now
documentedAt: YYYY-MM-DD        # date of first generation
lastVerified: YYYY-MM-DD        # date of last verification (update when re-running research)
sourceRepo: string              # path to source repo; ~/... convention (os.path.expanduser / Node os.homedir() resolves it)
sourcePath: string              # relative path from sourceRepo to the main source file

# --- TAXONOMY (required) ---
tags: string[]                  # free-form, lowercase, used for discovery
techStack:
  primary: string[]             # languages, frameworks
  infra: string[]               # hosting, databases, services
  libs: string[]                # notable libraries with meaningful roles

# --- DEPENDENCIES (required; empty array allowed) ---
dependencies:
  - name: string                # identifier
    path: string                # relative path in sourceRepo (if applicable)
    kind: module | postgres-table | service | config  # optional, defaults to module
    role: string                # one sentence on what this dependency provides

# --- COMMANDS (required for kind: cli-component/cli-tool; empty array otherwise) ---
commands:
  - id: string                  # kebab-case identifier for the command
    invocation: string          # exact executable command with concrete flags
    shortFlag: string           # optional compact form if one exists
    example: string             # optional concrete example with real arguments
    purpose: string             # one sentence
    verified: boolean           # true only if tested in the last research pass
    args:                       # optional
      - name: string
        required: boolean
        description: string

# --- MECHANISMS (required; empty array allowed) ---
mechanisms:
  - id: string                  # kebab-case identifier
    claim: string               # one declarative sentence — what the mechanism does
    invariant: string           # optional — what property is enforced
    evidence: string            # file:line or file:lineStart-lineEnd in sourceRepo
    rationale: string           # optional — why this design over alternatives

# --- STATUS (required) ---
status:
  stage: active | stable | dormant | archived
  lastCommitAt: YYYY-MM-DD      # most recent meaningful commit to sourcePath
  knownIssues:                  # empty array allowed
    - id: string
      description: string       # one sentence
      severity: low | medium | high | critical
      evidence: string          # file:line
      scope: this-doc | dependency-not-this-doc

# --- SCOPE (required) ---
scope:
  inDoc: string[]               # what this doc covers
  outOfScope: string[]          # what this doc explicitly does NOT cover

# --- RELATED (required; empty array allowed) ---
related:
  - slug: string                # another agent-docs entry
    relation: string            # one phrase on how they relate
---
```

---

## JSON endpoint contracts

### `GET /api/docs/{slug}.json`

Returns the full frontmatter of the requested entry as JSON. Field names and structure match the YAML spec above exactly.

**404** if no entry exists for the slug.
**Content-Type:** `application/json; charset=utf-8`
**Caching:** no-cache during development; CDN-cached with short TTL in production.

### `GET /api/docs/index.json`

Returns an array of corpus entries for every file under `src/content/agent-docs/`:

```json
[
  {
    "slug": "table-manager",
    "kind": "cli-component",
    "displayName": "Table Version Manager",
    "tagline": "Rich-powered CLI for versioned Postgres tables.",
    "tags": ["postgresql", "cli", "versioning", "python"],
    "status": { "stage": "stable" },
    "lastVerified": "2026-04-21"
  }
]
```

Fields are a subset of the full frontmatter — enough for discovery, not the whole payload.

---

## Provenance rules

- `documentedBy` is `"MotherMind"` until we have other authors.
- `documentedAt` is set once, at page creation. Never changed.
- `lastVerified` is updated every time the page's research is re-run or its `verified: true` commands are re-tested.
- If `lastVerified` is more than 90 days old, treat the page as **stale** — re-verify before trusting `commands[]`.

---

## Versioning

This schema is version `0.2`. Breaking changes (renames, removals, type changes) bump the minor digit. Additive changes (new optional fields) do not bump.

All existing agent-docs files must conform to the current schema. Migration is required on breaking changes; no backwards-compatibility shims.

---

## Validation

A future `devdeck-validator-agent` will enforce this schema. Manual validation checklist until then:

- [ ] All required fields present and non-null
- [ ] `slug` matches filename
- [ ] `sourceRepo` uses `~/...` path convention
- [ ] `sourcePath` (relative to `sourceRepo`) exists on disk
- [ ] Every `mechanisms[].evidence` and `knownIssues[].evidence` file:line resolves to a real file
- [ ] Every `commands[].invocation` runs without error when `verified: true`
- [ ] `related[].slug` values match other real agent-docs entries
- [ ] `lastVerified` is recent enough to trust `verified: true` commands

---

## Example: minimal valid page

```mdx
---
slug: example
kind: cli-tool
displayName: Example Tool
tagline: Minimal demo of the schema.

documentedBy: MotherMind
documentedAt: 2026-04-23
lastVerified: 2026-04-23
sourceRepo: ~/path/to/source/repo
sourcePath: src/example.py

tags: [demo]
techStack:
  primary: [Python]
  infra: []
  libs: []

dependencies: []

commands:
  - id: run
    invocation: python src/example.py
    purpose: Prints hello world.
    verified: true

mechanisms: []

status:
  stage: stable
  lastCommitAt: 2026-04-23
  knownIssues: []

scope:
  inDoc: [the run command]
  outOfScope: [everything else]

related: []
---
```
