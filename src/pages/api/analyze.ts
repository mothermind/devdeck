export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const { modelId, text, candidateLabels } = await request.json();

  const token = (import.meta.env.HUGGINGFACE_TOKEN ?? '').trim();

  if (!token) {
    return new Response(JSON.stringify({ error: 'HUGGINGFACE_TOKEN not set in .env' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch(`https://router.huggingface.co/hf-inference/models/${modelId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        candidate_labels: candidateLabels,
        hypothesis_template: '{}',
        multi_label: true,
      },
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
