/**
 * LaravelApiClient
 * ----------------
 * Responsibilities:
 * 1. Send internal HTTP requests to the Laravel backend to register
 *    Cloudinary image URLs for a given product.
 * 2. Authenticate using a shared secret token via the `X-Internal-Token` header.
 * 3. Handle network and 5xx errors with retry + backoff.
 * 4. Avoid retrying on 4xx validation errors (bad product id, invalid payload, etc.).
 * 5. Log all outgoing requests and responses with structured logs (info/warn/error).
 *
 * Environment variables needed:
 * - LARAVEL_API_BASE_URL
 * - LARAVEL_API_TOKEN
 * - RETRY_ATTEMPTS=3
 * - RETRY_BACKOFF_MS=500
 *
 * Main method:
 * - registerProductImages(productId, imageUrls)
 *    -> success: boolean
 *    -> on failure, return error info and log appropriately.
 */