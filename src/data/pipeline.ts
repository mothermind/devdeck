// Shared pipeline data — imported by pipeline.astro and /api/pipeline.json.ts.
// Lifted from src/pages/project1/pipeline.astro to avoid duplication.

export interface Destination {
  label: string;
  value: string;
  note?: string;
}

export interface Stage {
  id: string;
  name: string;
  project: string;
  github?: string;
  description: string;
  features: string[];
  source: string;
  destination: Destination[];
  tech: string[];
  notes?: string;
  schema?: Record<string, string>;
  guide?: string;
  guideLabel?: string;
}

export const GROUP_LABEL: Record<string, string> = {
  OY: 'Data Collection',  BK: 'Data Collection',
  S1: 'Core Processing',  S2: 'Core Processing',
  REV: 'Review & Trends', SENT: 'Review & Trends', TREND: 'Review & Trends',
  S3N: 'OCR & AI Analysis', S4: 'OCR & AI Analysis', S5: 'OCR & AI Analysis',
  S6: 'OCR & AI Analysis',  S7: 'OCR & AI Analysis',
  INGR: 'Embeddings',
};

export const stages: Stage[] = [
  {
    id: "OY",
    name: "OY Scraper",
    project: "oliveyoung-scraper-async",
    github: "https://github.com/KBWW/oliveyoung-scraper-async",
    description: "The primary entry point for the pipeline. Crawls Olive Young's K-Beauty catalog to extract product metadata, pricing, and images at scale.",
    features: [
      "Crawls category trees across Olive Young's full K-Beauty product listing",
      "Extracts metadata: name, brand, price, size, ingredients, ratings, review count",
      "Downloads and uploads product images directly to S3",
      "Runs 2 parallel workers with a 2s inter-request delay to avoid bot detection",
    ],
    source: "Olive Young website (categories)",
    destination: [
      { label: "DynamoDB", value: "OliveYoung_MetaData", note: "PK: itemId / SK: category2" },
      { label: "S3", value: "images/olive_young/" },
    ],
    tech: ["Python", "Playwright", "AsyncIO", "boto3"],
    notes: "parallel(2) + delay(2s) — site uses fingerprint-based bot detection; headless Chromium with randomized viewport helps bypass it.",
    schema: { itemId: "String", itemName: "String", brandId: "String", brandName: "String", category1: "String", category2: "String", originalPrice: "Number", salePrice: "Number", size: "String", ingredients: "String", ratings: "Number", reviews: "Number" },
    guide: "/project1/scrapers",
    guideLabel: "Scrapers → OY Products",
  },
  {
    id: "BK",
    name: "BK Scraper",
    project: "bkurly-scraper-async",
    github: "https://github.com/KBWW/bkurly-scraper-async",
    description: "Mirrors the OY scraper pattern but targets Beauty Kurly, which uses a different category structure and requires higher concurrency.",
    features: [
      "Crawls Beauty Kurly category trees with a 5-worker async pool",
      "Extracts metadata: name, brand, category, price, ingredients, reviews",
      "Downloads and uploads product images to S3",
      "3s delay between requests — Beauty Kurly enforces stricter rate limits than OY",
    ],
    source: "Beauty Kurly website (categories)",
    destination: [
      { label: "DynamoDB", value: "BK_MetaData", note: "PK: itemId" },
      { label: "S3", value: "images/beauty_kurly/" },
    ],
    tech: ["Python", "Playwright", "AsyncIO", "boto3"],
    notes: "parallel(5) + delay(3s) — higher parallelism is safe due to session-scoped cookies isolating requests.",
    schema: { itemId: "String", brandName: "String", categoryId: "String", ingredients: "String", itemName: "String", originalPrice: "Number", reviews: "Number", salePrice: "Number", size: "String" },
    guide: "/project1/scrapers",
    guideLabel: "Scrapers → BK Products",
  },
  {
    id: "S1",
    name: "Step 1: Data Loading",
    project: "product-db-pipeline",
    description: "Reads raw scraped records from both DynamoDB tables and normalizes them into a unified in-memory DataFrame for downstream processing.",
    features: [
      "Scans OliveYoung_MetaData and BK_MetaData in full via DynamoDB pagination",
      "Normalizes source-specific field names into a single unified schema",
      "Casts numeric strings (price, ratings) to proper types",
      "Outputs a combined in-memory DataFrame for the next step",
    ],
    source: "DynamoDB: OliveYoung_MetaData, BK_MetaData",
    destination: [{ label: "Output", value: "In-memory DataFrame" }],
    tech: ["Python", "boto3", "pandas"],
  },
  {
    id: "S2",
    name: "Step 2: Preprocessing & Grouping",
    project: "product-db-pipeline",
    description: "Cleans and deduplicates records, groups similar products across both sources, and identifies a single representative product per group.",
    features: [
      "Cleans ingredient strings, trims whitespace, drops malformed records",
      "Groups similar products by name/ingredient similarity across OY and BK",
      "Selects a representative product per group based on review count",
      "Writes the cleaned, versioned dataset to PostgreSQL",
    ],
    source: "In-memory DataFrame from Step 1",
    destination: [{ label: "PostgreSQL", value: "product_raw_{version}" }],
    tech: ["Python", "pandas", "psycopg2"],
  },
  {
    id: "REV",
    name: "Review Scraper",
    // Corrected from "review-scrapper-async" (double-p) to "review-scraper-async" (single-p).
    project: "review-scraper-async",
    github: "https://github.com/cch0213/review-scraper-async",
    description: "Fetches paginated customer reviews for every product in the product_raw table, writing results in batches to Parquet files on S3.",
    features: [
      "Reads product list from PostgreSQL product_raw table",
      "Scrapes paginated reviews per product using Playwright",
      // Corrected from 500 to 200 — code comment: "Reduced from 500 to save progress more frequently".
      "Serializes results in batches of 200 to Parquet via PyArrow",
      "Writes a _manifest.json per run tracking batch counts and run ID",
    ],
    source: "PostgreSQL: product_raw_{version}",
    destination: [
      { label: "S3", value: "data/reviews/raw/{run_id}/" },
      { label: "Format", value: "_manifest.json + scraper_results_{batch}_{run_id}.parquet" },
    ],
    tech: ["Python", "Playwright", "PyArrow"],
    guide: "/project1/scrapers",
    guideLabel: "Scrapers → Reviews",
  },
  {
    id: "SENT",
    name: "Sentiment Analysis",
    project: "skincare-analysis",
    github: "https://github.com/KBWW/skincare-analysis",
    description: "A 4-step GPU pipeline that preprocesses Korean review text, runs transformer inference for sentiment and aspect scoring, merges results, and uploads to PostgreSQL.",
    features: [
      "Preprocesses Korean text with KoNLPy (Okt tokenizer) — tokenization, stopword removal",
      "Runs batch inference (512 samples) on a RunPod A5000 GPU using jhgan/ko-sroberta-multitask",
      "Scores sentiment (positive/negative/neutral) and 4 aspect dimensions per review",
      "Extracts keyword categories: effects, texture, satisfaction, skin condition, product, economy",
    ],
    source: "S3: data/reviews/raw/{date}/*.parquet",
    destination: [
      { label: "S3 (preprocessed)", value: "preprocessed_data_{date}/" },
      { label: "S3 (processed)", value: "processed_results_{date}/" },
      { label: "S3 (merged)", value: "merged_results_{date}/" },
      { label: "PostgreSQL", value: "product_review_{version}" },
    ],
    tech: ["Python", "KoNLPy (Okt)", "PyTorch", "Transformers"],
    notes: "GPU: RunPod A5000 · Model: jhgan/ko-sroberta-multitask · batch_size: 512 · chunk_size: 10k reviews. Intermediate S3 writes act as checkpoints — each step is re-runnable independently.",
    schema: { keywords: "keywords_effects, keywords_texture, keywords_satisfaction, keywords_skin_condition, keywords_product, keywords_economy", sentiment: "SA_positive, SA_negative, SA_neutral", aspects: "aspect_{moisture,effectiveness,texture,absorption}_{pos,neg,neu}", satisfaction: "satisfaction_very, satisfaction_somewhat, satisfaction_un" },
    guide: "/project1/sentiment",
    guideLabel: "Sentiment Analysis",
  },
  {
    id: "TREND",
    name: "Search Trend Scraper",
    project: "search-trend-scraper-async",
    github: "https://github.com/KBWW/search-trend-scraper-async",
    description: "A 2-stage ETL that pulls absolute search volume from Naver APIs and normalizes it into a per-product trend score relative to brand-level review volume.",
    features: [
      "Calls Naver Datalab API for absolute monthly search counts per brand/product keyword",
      "Calls Naver Keyword Tool API for relative search index",
      "Normalizes raw counts: search_trend = abs_count × (group_reviews / total_brand_reviews)",
      "Joins trend data with product_raw and product_review tables for the final versioned table",
    ],
    source: "Naver Datalab API, Naver Keyword Tool API + PostgreSQL: brand, product_raw, product_review",
    destination: [
      { label: "CSV", value: "data/YYMMDD/naver_trends_data_*_final.csv" },
      { label: "PostgreSQL", value: "product_search_trend_{version}" },
    ],
    tech: ["Python", "requests", "pandas"],
    notes: "search_trend = abs_count × (group_reviews / total_brand_reviews) — normalizes raw volume against review distribution to make cross-brand comparisons meaningful.",
    guide: "/project1/search-trend",
    guideLabel: "Search Trend Scraper",
  },
  {
    id: "S3N",
    name: "Step 3: OCR Extraction",
    project: "product-db-pipeline",
    description: "Runs Google Cloud Vision OCR on product images for representative products, extracting visible text overlays such as ingredient callouts and product claims.",
    features: [
      "Identifies representative products from DynamoDB metadata",
      "Fetches product images from S3 and sends to Google Cloud Vision API",
      "Extracts all detected text tokens from each image",
      "Stores keyword lists in DynamoDB per itemId for downstream use",
    ],
    source: "DynamoDB: OliveYoung_MetaData, BK_MetaData · S3: images/",
    destination: [{ label: "DynamoDB", value: "OliveYoung_ItemKeywords, BK_ItemKeywords" }],
    tech: ["Python", "Google Cloud Vision API", "boto3"],
  },
  {
    id: "S4",
    name: "Step 4: Prepare Analysis Data",
    project: "product-db-pipeline",
    description: "Assembles a structured batch payload for each representative product — OCR keywords, base64-encoded images, and mapped category labels — ready for GPT-4o mini.",
    features: [
      "Loads representative products from PostgreSQL product_raw",
      "Fetches OCR keyword tokens from DynamoDB per product",
      "Base64-encodes product images for multimodal API input",
      "Maps numeric category IDs to human-readable labels for prompt context",
    ],
    source: "PostgreSQL: product_raw_{version} · DynamoDB: ItemKeywords · S3: images",
    destination: [{ label: "Output", value: "Prepared batch data for AI analysis" }],
    tech: ["Python", "boto3", "PIL", "pandas"],
  },
  {
    id: "S5",
    name: "Step 5: AI Analysis",
    project: "product-db-pipeline",
    description: "Processes each product batch through GPT-4o mini via the OpenAI API using the KeywordExtractor module to extract standardized product attributes.",
    features: [
      "Sends prepared product payloads (image + text context) to GPT-4o mini",
      "Uses the KeywordExtractor module to structure prompts and parse responses",
      "Extracts skin type compatibility, concern tags, texture descriptors, product claims",
      "Returns raw structured analysis results for processing in Step 6",
    ],
    source: "Prepared batch data from Step 4",
    destination: [{ label: "Output", value: "Raw analysis results" }],
    tech: ["Python", "OpenAI API (GPT-4o mini)"],
    notes: "Module: KeywordExtractor — encapsulates prompt templating, retry logic, and response validation.",
  },
  {
    id: "S6",
    name: "Step 6: Process Analysis Results",
    project: "product-db-pipeline",
    description: "Maps numeric answer codes to human-readable option text, merges newly analyzed products with the existing versioned table, and writes the combined result.",
    features: [
      "Maps numeric API response values to their corresponding option text labels",
      "Loads existing analysis records from the active versioned product_analysis table",
      "Merges new results with existing data, deduplicating on product group ID",
      "Writes the combined dataset to the versioned product_analysis table",
    ],
    source: "Raw analysis results from Step 5",
    destination: [{ label: "PostgreSQL", value: "product_analysis_{version}" }],
    tech: ["Python", "pandas", "psycopg2"],
  },
  {
    id: "S7",
    name: "Step 7: Feature Engineering",
    project: "product-db-pipeline",
    description: "Computes item-level and group-level features — price tiers, popularity scores, vitality indexes, lifecycle stages — and writes the final product_service table.",
    features: [
      "Computes item-level features: size category, price tier, discount rate",
      "Calculates group-level popularity score from review count + trend data",
      "Derives vitality index and lifecycle stage (rising / stable / declining)",
      "Produces product_service — the final table consumed by the API layer",
    ],
    source: "PostgreSQL: product_analysis_{version}",
    destination: [{ label: "PostgreSQL", value: "product_service_{version} (Final)" }],
    tech: ["Python", "pandas", "psycopg2"],
  },
  {
    id: "INGR",
    name: "Ingredient Embeddings",
    project: "backend-trendmix-dev",
    github: "https://github.com/cch0213/backend-trendmix-dev",
    description: "Computes KLUE-BERT embeddings for all unique ingredients extracted from the analysis table, enabling semantic ingredient search in the API.",
    features: [
      "Reads unique ingredient strings from product_analysis (question_id: CM00aa7ace476c60)",
      "Runs KLUE-BERT (klue/bert-base) to produce 768-dim embeddings per ingredient",
      "Saves embedding map to S3 as JSON for the production API",
      "Caches locally under app/data/embeddings/ for dev/testing",
    ],
    source: "PostgreSQL: product_analysis_{version} (question_id: CM00aa7ace476c60)",
    destination: [
      { label: "S3", value: "models/data/ingredient-search/ingredient_embeddings.json" },
      { label: "Local cache", value: "app/data/embeddings/ingredient_embeddings.json" },
    ],
    tech: ["Python", "Transformers", "PyTorch", "KLUE-BERT"],
    notes: "Model: klue/bert-base · 768-dim vectors · cosine similarity used at query time.",
    guide: "/project1/ingredient-embeddings",
    guideLabel: "Ingredient Embeddings",
  },
];
