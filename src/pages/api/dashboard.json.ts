export const prerender = true;

import type { APIRoute } from 'astro';
import { stageStatus, STAGES } from '../../lib/pipelineStatus';
import dbStatsRaw from '../../data/db_stats.json';
import lastRunRaw from '../../data/last_run_dates.json';

const dbStats = dbStatsRaw as {
  postgresql: Record<string, { version: number; rows: number; active: boolean; created_at?: string }[]>;
  s3: { name: string; objects: number; size_gb: number }[];
  s3_data: { name: string; version: string; type: string; files: number; size_gb: number }[];
  dynamodb: { name: string; items: number; size_bytes: number }[];
};
const lastRun = lastRunRaw as Record<string, string>;

export const GET: APIRoute = () => {
  const today = new Date();

  // ── Pipeline stages ──────────────────────────────────────
  const stages = STAGES.map(([name, key]) => {
    const s = stageStatus(lastRun[key], today);
    return {
      slug: key,
      name,
      lastRun: lastRun[key] ?? null,
      status: s.label,
    };
  });

  // ── Databases ────────────────────────────────────────────
  const postgresql = dbStats.postgresql;
  const s3_data    = dbStats.s3_data;
  const s3_images  = dbStats.s3;   // "s3" in db_stats = images & models
  const dynamodb   = dbStats.dynamodb;

  const payload = {
    generatedAt: today.toISOString(),
    pipeline: { stages },
    databases: {
      postgresql,
      s3_data,
      s3_images,
      dynamodb,
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};
