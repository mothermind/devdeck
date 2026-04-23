export const prerender = false;

import type { APIRoute } from 'astro';

interface AgentDocsFrontmatter {
  slug?: string;
  displayName?: string;
  tagline?: string;
}

// Glob all agent-docs MDX files from the data-only location.
const pages = import.meta.glob('/src/content/agent-docs/*.mdx', { eager: true });

export const GET: APIRoute = async () => {
  const entries: { slug: string; displayName: string; tagline: string }[] = [];

  for (const [, mod] of Object.entries(pages)) {
    const m = mod as { frontmatter?: AgentDocsFrontmatter };
    const fm = m.frontmatter;
    if (!fm || !fm.slug) continue;
    entries.push({
      slug:        String(fm.slug),
      displayName: String(fm.displayName ?? fm.slug),
      tagline:     String(fm.tagline ?? ''),
    });
  }

  const agentDocsLines = entries
    .map(e => `- [${e.displayName}](/api/docs/${e.slug}.json): ${e.tagline}`)
    .join('\n');

  const body = `# DevDeck

> Portfolio of agent-consumable documentation for a K-Beauty skincare analysis pipeline. Agent-readable JSON specs for each subsystem. Human-readable narrative pages live under /project1/ and /project2/.

## Agent docs (structured JSON)

- [Corpus index](/api/docs/index.json): list of every documented subsystem
${agentDocsLines}

## Human pages (narrative)

- [Pipeline overview](/project1/pipeline)
- [Ingredient Embeddings](/project1/ingredient-embeddings)
- [Search Trend Scraper](/project1/search-trend)
- [Table Manager](/project1/table-manager)
- [Scrapers](/project1/scrapers)
- [Sentiment](/project1/sentiment)
- [Hypothesis Explorer](/project2/hypothesis-explorer)
- [Cheatsheet](/cheatsheet)
`;

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
