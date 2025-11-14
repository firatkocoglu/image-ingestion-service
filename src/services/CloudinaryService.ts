/**
 * CloudinaryService
 * ------------------
 * Responsibilities:
 * 1. Download image URLs (from Unsplash) as binary buffers.
 * 2. Detect MIME type if necessary.
 * 3. Upload buffers to Cloudinary under:
 *      products/<productId>/image_<index>.jpg
 * 4. Return Cloudinary secure URLs for each uploaded image.
 * 5. Apply retry + exponential backoff when Cloudinary returns errors.
 * 6. Log all events (info, warn, error) using the Pino logger.
 *
 * Environment variables needed:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 * - CLOUDINARY_UPLOAD_FOLDER=products
 * - RETRY_ATTEMPTS=3
 * - RETRY_BACKOFF_MS=500
 *
 * Methods:
 * - downloadImage(url) -> Buffer
 * - uploadImage(buffer, productId, index) -> secure_url
 * - uploadAll(imageUrls, productId) -> secure_url[]
 */