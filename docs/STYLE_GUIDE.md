# DevDeck — Style Guide

> Canonical reference for styling decisions in the `apparent-astronaut` Astro project.
> When adding new UI, match these rules. When changing existing UI, update this document.

---

## 1. Design Tokens

All tokens are CSS custom properties defined in `src/layouts/Base.astro`.

### Colors

| Token | Value | Role |
|---|---|---|
| `--bg` | `#FAF6F0` | Page background (calm ivory) |
| `--surface` | `#F0EBE3` | Card / elevated surfaces |
| `--sidebar-bg` | `#EDE8E0` | Sidebar background |
| `--border` | `#D5CEC4` | Default borders |
| `--border-hi` | `#C4BBB0` | Emphasized borders (sparingly) |
| `--text` | `#1A1A1A` | Primary text, headings (near black) |
| `--text-muted` | `#555555` | Body text, secondary content (dark grey) |
| `--text-dim` | `#888888` | Labels, captions, metadata |
| `--accent` | `#D4620A` | Interactive elements, active states (orange) |
| `--accent-bg` | `rgba(212,98,10,0.08)` | Active item background tint |
| `--code-bg` | `#1A1A1A` | Code block background (black) |
| `--code-text` | `#E8E8E8` | Code block text (white) |

**Rules:**
- Never use raw hex for any of the above — always use the token.
- Status colors (ok/stale/old) and diagram node colors are the only acceptable hardcoded hex values.
- Hover backgrounds use `rgba(0, 0, 0, 0.03)` or `rgba(0, 0, 0, 0.04)` — never dark-theme `rgba(99,…)` values.

### Fonts

| Token | Stack | Role |
|---|---|---|
| `--font-heading` | DM Sans, -apple-system, system-ui, sans-serif | H1–H5 headings |
| `--font-sans` | Fragment Mono, ui-monospace, SF Mono, Menlo, monospace | Body text, nav, labels |
| `--font-mono` | JetBrains Mono, SF Mono, ui-monospace, Menlo, monospace | Code, tags, badges, numeric data |

---

## 2. Typography

### Headings

Defined globally in `Base.astro`. Do not override per-page.

| Level | Size | Weight | Tracking | Color |
|---|---|---|---|---|
| H1 | `2rem` | 700 | `-0.03em` | `var(--text)` |
| H2 | `1.375rem` | 700 | `-0.03em` | `var(--text)` |
| H3 | `1.125rem` | 700 | `-0.03em` | `var(--text)` |

### Body Text

- Font: `var(--font-sans)` (Fragment Mono)
- Size: `15px` base / `1rem`
- Line-height: `1.8`
- Color: `var(--text-muted)`

### Section Labels *(canonical)*

Used for: dashboard section titles, table group headers, spec card titles, eyebrow groups, TOC heading, table `<th>`.

```css
font-size: 0.68rem;
font-weight: 500;
letter-spacing: 0.1em;
text-transform: uppercase;
color: var(--text-dim);
```

### Eyebrow (page-level category)

Used above the H1 in `PageHeader.astro` only.

```css
font-family: var(--font-sans);
font-size: 0.72rem;
font-weight: 600;
letter-spacing: 0.1em;
text-transform: uppercase;
color: var(--accent);
```

---

## 3. Components

### Tabs (primary section navigation)

Used for: scraper tabs, sentiment stages, ingredient-embeddings sections, search-trend stages.

**Tab bar:**
```css
display: flex;
border-bottom: 1px solid var(--border);
margin-bottom: 1.5rem;
```

**Tab button:**
```css
font-family: var(--font-sans);
font-size: 0.9rem;
color: var(--text-muted);              /* active: var(--accent) */
border-bottom: 2px solid transparent;  /* active: var(--accent) */
padding: 0.65rem 1.25rem;
```

### Segmented Control (subtabs)

Used for: Run / Status / Logs / Deploy / Config / Info sections within tabs.

**Bar:**
```css
display: inline-flex;
gap: 2px;
background: var(--surface);
border: 1px solid var(--border);
border-radius: 8px;
padding: 3px;
```

**Button:**
```css
font-family: var(--font-sans);
font-size: 0.8rem;
color: var(--text-muted);   /* active: var(--text) */
background: none;           /* active: var(--border) */
border-radius: 6px;
padding: 0.35rem 0.85rem;
```

### Metadata Tags / Tech Badges *(canonical pill)*

Used for: page header tags, tech stack badges. Same visual treatment.

```css
font-family: var(--font-mono);
font-size: 0.72rem;
color: var(--text-muted);
background: var(--surface);
border: 1px solid var(--border);
border-radius: 999px;
padding: 0.18rem 0.7rem;
letter-spacing: 0.04em;
```

### Status Badge (colored identifier)

Used for: pipeline stage IDs (`OY`, `S1`, etc.). Retains accent color to signal identity.

```css
font-family: var(--font-mono);
font-size: 0.72rem;
font-weight: 500;
color: var(--accent);
background: var(--accent-bg);
border: 1px solid rgba(212, 98, 10, 0.25);
border-radius: 6px;
padding: 0.18rem 0.6rem;
letter-spacing: 0.04em;
```

### Button-Links (pill nav / guide links) *(canonical)*

Used for: quick-access pills on dashboard, guide links in pipeline.

```css
font-size: 0.82rem;
color: var(--text-muted);
background: var(--surface);
border: 1px solid var(--border);
border-radius: 20px;
padding: 0.25rem 1rem;
text-decoration: none;
transition: border-color 0.15s, color 0.15s;
```
Hover: `border-color: var(--accent); color: var(--accent);`

### Inline Code

```css
font-family: var(--font-mono);
font-size: 0.82em;
font-weight: 500;
background: rgba(0, 0, 0, 0.05);
border: 1px solid var(--border);
border-radius: 6px;
padding: 0.1em 0.45em;
color: var(--text);
```

### Code Blocks (`<pre>`)

```css
font-family: var(--font-mono);
font-size: 0.82rem;
background: var(--code-bg);
border: 1px solid rgba(0, 0, 0, 0.12);
border-radius: 12px;
padding: 1.1rem 1.4rem;
line-height: 1.7;
color: var(--code-text);
```

Copy button sits on the dark code block background:
```css
color: #666;           /* hover: #bbb */
border-color: transparent; /* hover: #444 */
/* copied state: color: var(--accent), border-color: rgba(212, 98, 10, 0.4) */
```

### Cards / Spec Panels

```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 12px;
padding: 1.25rem 1.5rem;
```

### Expanders (details/summary)

```css
/* details */
border: 1px solid var(--border);
border-radius: 12px;

/* summary */
background: var(--surface);
color: var(--text-muted);  /* open: var(--text) */
/* hover: background: rgba(0, 0, 0, 0.03) */

/* marker */
content: '›';  /* rotates 90deg on open */
color: var(--text-dim);
```

### Notes / Callout Block

```css
border-left: 3px solid rgba(212, 98, 10, 0.3);
background: rgba(212, 98, 10, 0.04);
border-radius: 0 8px 8px 0;
padding: 0.65rem 1.1rem;
```
Text inside: `font-size: 0.85rem; color: var(--text-dim); font-style: italic;`

### Tables

Global `<th>`:
```css
font-size: 0.68rem;
font-weight: 500;
letter-spacing: 0.1em;
text-transform: uppercase;
color: var(--text-dim);
border-bottom: 1px solid var(--border);
padding: 0.5rem 0.75rem;
```

Global `<td>`:
```css
padding: 0.5rem 0.75rem;
border-bottom: 1px solid rgba(0, 0, 0, 0.06);
color: var(--text-muted);
/* td:first-child: color: var(--text), font-family: var(--font-mono), font-size: 0.8rem */
```

Compact tables (`.db-table` on dashboard):
```css
/* th */ padding: 0.25rem 0.6rem;
/* td */ padding: 0.42rem 0.6rem;
/* hover */ background: rgba(0, 0, 0, 0.03);
```

---

## 4. Navigation

### Header

```css
background: rgba(250, 246, 240, 0.92);
backdrop-filter: blur(12px);
border-bottom: 1px solid var(--border);
height: var(--header-h);  /* 56px */
```

Search dropdown shadow: `0 8px 32px rgba(0, 0, 0, 0.1)`
Result hover: `rgba(0, 0, 0, 0.04)`

### Sidebar Nav Links

```css
font-family: var(--font-sans);
font-size: 0.85rem;
font-weight: 400;          /* active: 500 */
color: var(--text-muted);  /* active: var(--accent) */
padding: 0.4rem 0.75rem;
border-radius: 10px;
letter-spacing: 0.01em;
transition: all 0.15s ease;
```
Hover background: `rgba(0, 0, 0, 0.04)`
Active background: `var(--accent-bg)`

### Sidebar Section Headers

```css
font-family: var(--font-heading);
font-size: 0.875rem;
font-weight: 600;
letter-spacing: -0.01em;
color: var(--text);
```

### TOC Links

```css
font-family: var(--font-sans);
font-size: 0.78rem;
font-weight: 500;         /* active: 500 */
color: var(--text-dim);   /* active: var(--accent) via :global */
transition: color 0.12s;
border-left: 2px solid transparent;  /* active: var(--accent) */
```
Sub-links (H3/H4): `font-size: 0.74rem; font-weight: 400;`

---

## 5. Layout

### Content Area

| Variant | max-width | Use |
|---|---|---|
| Default | `900px` (`--content-max`) | All doc pages |
| Wide | `1100px` | Dashboard |

Dashboard hides the TOC panel (`showToc={false}`).

### Grid Layouts

| Layout | Columns | Gap |
|---|---|---|
| Stage grid | `repeat(4, 1fr)` | `0.5rem` |
| DB layout | `3fr 2fr` | `2rem` |

---

## 6. Spacing Scale

| Use | Value |
|---|---|
| Between major sections (HR) | `1.5rem 0` |
| H2 margin-top | `2.5rem` |
| H3 margin-top | `1.75rem` |
| Card internal padding | `1.25rem 1.5rem` |
| Stage grid gap | `0.5rem` |
| DB layout gap | `2rem` |
| Tag row gap | `0.4rem` |
| Badge/pill gap | `0.45rem` |
| Tab bar margin-bottom | `1.5rem` |
| Seg bar margin-bottom | `1rem` |

---

## 7. Border Radius Scale

| Use | Value |
|---|---|
| Pills / metadata tags | `999px` |
| Button-links | `20px` |
| Cards, code blocks, dropdowns | `12px` |
| Expanders (details) | `12px` |
| Stage cards, search results | `8px` |
| Segmented control bar | `8px` |
| Nav links, search bar | `10px` |
| Inline code, copy button | `6px` |
| Status badges | `6px` |
| Segmented control buttons | `6px` |
| Destination value chips | `4px` |

---

## 8. Transitions

All interactive elements use one of two durations:

- **`0.15s`** — color, border-color, background (standard)
- **`0.12s`** — TOC link color (slightly tighter)
- **`0.2s`** — transform (details marker rotation)
- **`0.4s`** — score bar width animation (HypothesisExplorer)

Easing: default browser ease (no custom cubic-bezier needed).

---

## 9. Status Colors (Hardcoded — acceptable)

| Status | Color |
|---|---|
| ok (≤14 days) | `#2da44e` |
| stale (15–35 days) | `#9e6a03` |
| old (>35 days) | `#cf222e` |
| neutral / unknown | `var(--text-dim)` |

---

## 10. Diagram Node Colors (Hardcoded — acceptable)

| Type | Color | Light fill |
|---|---|---|
| Scraper | `#D4620A` | `#FFF3EB` |
| Process | `#2d8a4e` | `#EDF7EF` |
| Storage | `#b8860b` | `#FDF6E3` |
| API | `#7c5cbf` | `#F3F0FA` |

Edge/arrow stroke: `#C4BBB0` / arrow fill: `#999`
