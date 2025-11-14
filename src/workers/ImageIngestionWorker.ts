/**
 * ImageIngestionWorker
 * ---------------------
 * Responsibilities:
 * 1. Load products from:
 *      - full dataset (products.json)
 *      - targeted rerun (--products=1,2,3)
 *      - failed-products.json (--useFailed)
 *
 * 2. For each product, run the ingestion pipeline:
 *      a) Fetch category-relevant images from Unsplash
 *      b) Download these URLs into buffers
 *      c) Upload buffers to Cloudinary and collect secure URLs
 *      d) Register uploaded URLs in the Laravel backend
 *
 * 3. Apply retry + exponential backoff for:
 *      - Unsplash (rate limit)
 *      - Cloudinary (network/server errors)
 *      - Laravel 5xx errors
 *
 * 4. Log each step with structured logs.
 *
 * 5. Track failed products and write them to failed-products.json:
 *      { "failed": [12,45,90] }
 *
 * 6. Suggest rerun commands:
 *      node index.js --products=12,45,90
 *
 * This worker is the orchestrator of the entire ingestion pipeline.
 */


/**
 * Targeted Rerun Design
 * ---------------------
 * The worker supports processing only a subset of products instead of all.
 *
 * CLI options:
 *   --products=12,45,90
 *      -> Only process these product IDs.
 *
 *   --useFailed
 *      -> Load failed-products.json and only retry those products.
 *
 * Behavior:
 * - full run: process entire dataset
 * - targeted run: filter products based on provided IDs
 * - failed rerun: read failed-products.json, re-attempt only those IDs
 *
 * This feature allows:
 * - quickly retrying transient failures (Cloudinary/Unsplash issues)
 * - avoiding reprocessing the entire catalog
 * - better development & production iteration
 */

