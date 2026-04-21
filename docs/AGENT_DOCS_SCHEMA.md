# Agent Docs Schema

**Version:** 0.1 (pilot)
**Last updated:** 2026-04-21
**Maintainer:** MotherMind

---

## Purpose

DevDeck's primary readers are **MotherMind and the subagents it spawns**. Ayden is a secondary reader using the same surface for personal quick-reference and portfolio display. No other audience exists today.

This document defines the page format optimized for the primary audience: **structured, parseable, grep-friendly, self-contained.** Human-readable polish is a rendering layer, not the source of truth.

**Scope of this schema:** pages under `/agent-docs/*`. Existing pages under `/`, `/project1/*`, `/project2/*`, `/cheatsheet/*` are NOT governed by this schema. They remain as-is unless a separate retrofit decision is made.

---

## Consumer contract

Agents consume agent-docs pages through three surfaces:

| Surface | URL pattern | Returns |
|---|---|---|
| Corpus index | `GET /api/docs/index.json` | Array of `{ slug, kind, tagline, tags, status.stage }` for every agent-docs page |
| Per-page data | `GET /api/docs/{slug}.json` | Full frontmatter of the requested page as JSON |
| Human view | `GET /agent-docs/{slug}` | Rendered HTML (same content, for human skim) |

**The JSON endpoints are the canonical surface.** When a subagent needs a command or a mechanism, it fetches the JSON — it does not scrape HTML.

---

## File layout

```
src/pages/agent-docs/{slug}.mdx          ← page source (frontmatter = data, body = render)
src/pages/api/docs/[slug].json.ts        ← per-page JSON endpoint (SSR)
src/pages/api/docs/index.json.ts         ← corpus index endpoint (SSR)
src/components/agent-docs/PageSchema.astro  ← deterministic renderer
```

---

## Frontmatter schema

Every agent-docs page MUST carry this frontmatter structure. Fields marked **required** cannot be omitted. Empty arrays (`[]`) are valid and mean "no entries"; missing fields are a schema violation.

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
sourceRepo: string              # absolute path to source repo on Ayden's machine
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
  - slug: string                # another agent-docs page
    relation: string            # one phrase on how they relate
---
```

---

## Body convention

The body of every agent-docs page is **one component call**. No prose. No additional sections.

```mdx
---
# ...frontmatter as above...
---

import PageSchema from '../../components/agent-docs/PageSchema.astro';

<PageSchema data={frontmatter} />
```

If a page needs prose (rare — reserved for narrative exceptions), it goes in a dedicated `notes:` frontmatter field (not yet defined; add to schema when the first real need surfaces).

**Why no prose in body:** prose drifts in voice, breaks section predictability, and agents have to parse it. Everything an agent needs is in the frontmatter. The PageSchema component is the one place we decide how to render.

---

## PageSchema rendering

`src/components/agent-docs/PageSchema.astro` renders the frontmatter deterministically. Human-readable layout, but the structure mirrors the data exactly.

**Required H2 sections in order:**

1. **Identity** — displayName, kind, tagline, tags
2. **Source** — sourceRepo, sourcePath, lastVerified
3. **Tech Stack** — primary / infra / libs
4. **Dependencies** — table of dependencies
5. **Commands** — table of commands, each with invocation block (copy-button enabled via Base.astro script)
6. **Mechanisms** — list of mechanisms with evidence links
7. **Status** — stage badge + knownIssues table
8. **Scope** — inDoc / outOfScope bullet lists
9. **Related** — link list to other agent-docs pages
10. **Provenance** — documentedBy, documentedAt (small muted footer)

Agents do not read the rendered HTML for structured data. The H2 order exists for the human skim and for fallback `<h2>`-based parsing if the JSON endpoint is ever unavailable.

---

## JSON endpoint contracts

### `GET /api/docs/{slug}.json`

Returns the full frontmatter of the requested page as JSON. Field names and structure match the YAML spec above exactly.

**404** if no page exists for the slug.
**Content-Type:** `application/json; charset=utf-8`
**Caching:** no-cache during development; CDN-cached with short TTL in production.

### `GET /api/docs/index.json`

Returns an array of corpus entries for every page under `src/pages/agent-docs/`:

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

This schema is version `0.1`. Breaking changes (renames, removals, type changes) bump the minor digit (`0.1` → `0.2`). Additive changes (new optional fields) do not bump.

All existing agent-docs pages must conform to the current schema. Migration is required on breaking changes; no backwards-compatibility shims.

---

## Validation

A future `devdeck-validator-agent` will enforce this schema. Manual validation checklist until then:

- [ ] All required fields present and non-null
- [ ] `slug` matches filename
- [ ] `sourceRepo` path exists on disk
- [ ] `sourcePath` (relative to `sourceRepo`) exists on disk
- [ ] Every `mechanisms[].evidence` and `knownIssues[].evidence` file:line resolves to a real file
- [ ] Every `commands[].invocation` runs without error when `verified: true`
- [ ] `related[].slug` values match other real agent-docs pages
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
documentedAt: 2026-04-21
lastVerified: 2026-04-21
sourceRepo: /path/to/source/repo
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
  lastCommitAt: 2026-04-21
  knownIssues: []

scope:
  inDoc: [the run command]
  outOfScope: [everything else]

related: []
---

import PageSchema from '../../components/agent-docs/PageSchema.astro';

<PageSchema data={frontmatter} />
```
