import { defineCollection } from 'astro:content';

// Define the agent-docs collection so Astro doesn't auto-generate it.
// Files are frontmatter-only MDX — consumed via import.meta.glob in the
// JSON API endpoints, not through the Content Collections query API.
const agentDocs = defineCollection({ type: 'content' });

export const collections = { 'agent-docs': agentDocs };
