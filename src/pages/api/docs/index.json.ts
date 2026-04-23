export const prerender = false;

import type { APIRoute } from 'astro';

interface CorpusEntry {
  slug: string;
  kind: string;
  displayName: string;
  tagline: string;
  tags: string[];
  status: { stage: string };
  lastVerified: string;
}

// Glob all agent-docs MDX files.
const pages = import.meta.glob('/src/content/agent-docs/*.mdx', { eager: true });

export const GET: APIRoute = async () => {
  const corpus: CorpusEntry[] = [];

  for (const [, mod] of Object.entries(pages)) {
    const m = mod as { frontmatter?: Record<string, unknown> };
    const fm = m.frontmatter;
    if (!fm) continue;

    corpus.push({
      slug:         String(fm.slug ?? ''),
      kind:         String(fm.kind ?? ''),
      displayName:  String(fm.displayName ?? ''),
      tagline:      String(fm.tagline ?? ''),
      tags:         Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
      status:       { stage: String((fm.status as Record<string, unknown>)?.stage ?? '') },
      lastVerified: String(fm.lastVerified ?? ''),
    });
  }

  return new Response(JSON.stringify(corpus), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
