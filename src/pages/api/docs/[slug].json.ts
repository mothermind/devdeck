export const prerender = false;

import type { APIRoute } from 'astro';

// Glob all agent-docs MDX files at build/request time.
// import.meta.glob with { eager: true } returns the module synchronously.
const pages = import.meta.glob('/src/pages/agent-docs/*.mdx', { eager: true });

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const key = `/src/pages/agent-docs/${slug}.mdx`;
  const mod = pages[key] as { frontmatter?: Record<string, unknown> } | undefined;

  if (!mod || !mod.frontmatter) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify(mod.frontmatter), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
