export const prerender = false;

import type { APIRoute } from 'astro';
import { stages, GROUP_LABEL } from '../../data/pipeline';

// Edges hand-encoded from the Mermaid flowchart in pipeline.astro.
// Encoding by hand is more reliable than parsing Mermaid syntax at runtime,
// and the topology only changes when the pipeline itself changes.
const edges = [
  // Data Collection → DynamoDB + S3
  { from: 'OY',  to: 'S1',   via: 'dynamodb:OliveYoung_MetaData + s3:images/olive_young/' },
  { from: 'BK',  to: 'S1',   via: 'dynamodb:BK_MetaData + s3:images/beauty_kurly/' },
  // Core Processing
  { from: 'S1',  to: 'S2',   via: 'dataframe' },
  { from: 'S2',  to: 'REV',  via: 'postgres:product_raw' },
  { from: 'S2',  to: 'S3N',  via: 'dynamodb:OliveYoung_MetaData+BK_MetaData + s3:images/' },
  { from: 'S2',  to: 'S4',   via: 'postgres:product_raw' },
  // Review & Trends branch
  { from: 'REV', to: 'SENT', via: 's3:data/reviews/raw/{run_id}/*.parquet' },
  { from: 'SENT',to: 'TREND',via: 'postgres:product_review' },
  // OCR & AI Analysis branch
  { from: 'S3N', to: 'S4',   via: 'dynamodb:OliveYoung_ItemKeywords+BK_ItemKeywords' },
  { from: 'S4',  to: 'S5',   via: 'prepared-batch-data' },
  { from: 'S5',  to: 'S6',   via: 'raw-analysis-results' },
  { from: 'S6',  to: 'S7',   via: 'postgres:product_analysis' },
  // Final outputs
  { from: 'S7',  to: 'INGR', via: 'postgres:product_analysis' },
];

export const GET: APIRoute = async () => {
  // Build the stages response — pick only the fields agents need.
  const stagesPayload = stages.map((s, i) => ({
    id:          s.id,
    order:       i + 1,
    group:       GROUP_LABEL[s.id] ?? '',
    name:        s.name,
    projectSlug: s.project,
    source:      s.source,
    destination: s.destination.map(d => d.value),
    tech:        s.tech,
    description: s.description,
    ...(s.github ? { github: s.github } : {}),
  }));

  // Unique projectSlugs with agent-doc URLs (skip stages with no project).
  const projectMap: Record<string, string> = {};
  for (const s of stages) {
    if (s.project && !projectMap[s.project]) {
      projectMap[s.project] = `/api/docs/${s.project}.json`;
    }
  }

  const payload = {
    name:    'KBWW Data Pipeline',
    tagline: '13-stage composition of 7 projects producing the product_service table.',
    stages:  stagesPayload,
    edges,
    projects: projectMap,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};


