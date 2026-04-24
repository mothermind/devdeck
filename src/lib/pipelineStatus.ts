/**
 * Shared pipeline-stage status logic.
 * Used by src/pages/index.astro and src/pages/api/dashboard.json.ts.
 * Thresholds: ≤14 days → ok, ≤35 days → stale, >35 days → old.
 */

export type StageStatus = "ok" | "stale" | "old";

export interface StageStatusResult {
  label: StageStatus | "—";
  color: string;
  dateStr: string;
}

export function stageStatus(
  dateStr: string | undefined,
  today: Date = new Date()
): StageStatusResult {
  if (!dateStr) return { label: "—", color: "var(--text-dim)", dateStr: "no record" };
  const d = new Date(dateStr);
  const days = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (days <= 14) return { label: "ok",    color: "#2da44e", dateStr: formatted };
  if (days <= 35) return { label: "stale", color: "#9e6a03", dateStr: formatted };
  return              { label: "old",   color: "#cf222e", dateStr: formatted };
}

/**
 * [displayName, lastRun key in last_run_dates.json]
 */
export const STAGES: [string, string][] = [
  ["OY Scraper",            "OY Scraper"],
  ["BK Scraper",            "BK Scraper"],
  ["Data Loading",          "Step 1: Data Loading"],
  ["Preprocessing",         "Step 2: Preprocessing & Grouping"],
  ["Review Scraper",        "Review Scraper"],
  ["Sentiment Analysis",    "Sentiment Analysis (skincare_analysis)"],
  ["Search Trend",          "Search Trend Scraper"],
  ["OCR Extraction",        "Step 3: OCR Extraction"],
  ["Prep Analysis Data",    "Step 4: Prepare Analysis Data"],
  ["AI Analysis",           "Step 5: AI Analysis"],
  ["Process Results",       "Step 6: Process Analysis Results"],
  ["Feature Engineering",   "Step 7: Feature Engineering"],
  ["Ingredient Embeddings", "Ingredient Embeddings"],
];
