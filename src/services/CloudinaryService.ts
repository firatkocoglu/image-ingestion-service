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

import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { retry } from '../utils/retry';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { image } from '../types/image';

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
    });
  }

  /*
   * Download image from Unsplash (as Buffer)
   */
  async downloadImage(url: string): Promise<Buffer> {
    return await retry(
      async () => {
        const response = await axios.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer', // We need response as buffer
          timeout: 8000,
        });

        return Buffer.from(response.data);
      },
      {
        operationName: 'cloudinary-download',
      },
    );
  }

  /*
   * Upload image buffer to Cloudinary
   */
  async uploadBuffer(buffer: Buffer, productId: string, index: number): Promise<UploadApiResponse> {
    return await retry(
      async () => {
        const folder = `${env.cloudinaryUploadFolder}/${productId}`;

        return new Promise<UploadApiResponse>((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: `image_${index}`,
              resource_type: 'image',
            },
            (err: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
              if (err) return reject(err);
              if (!result?.secure_url)
                return reject(new Error('No secure_url returned from Cloudinary'));
              resolve(result);
            },
          );
          upload.end(buffer);
        });
      },
      {
        operationName: 'cloudinary-upload',
      },
    );
  }

  /*
   * Upload multiple image URLs to Cloudinary sequentially
   */
  async uploadAll(imageUrls: string[], productId: number): Promise<image[]> {
    const images: image[] = [];

    // sequential upload
    for (let i = 0; i < imageUrls.length; i++) {
      const originalUrl = imageUrls[i];

      logger.info(
        {
          productId,
          originalUrl,
          index: i,
        },
        'Downloading image for Cloudinary',
      );

      const buffer = await this.downloadImage(originalUrl);

      logger.info(
        {
          productId,
          index: i,
        },
        'Uploading buffer to Cloudinary',
      );

      const imageResponse = await this.uploadBuffer(buffer, productId.toString(), i);

      const { secure_url, public_id, width, height, bytes, format } = imageResponse;
      images.push({ secureUrl: secure_url, publicId: public_id, width, height, bytes, format });
    }

    logger.info(
      {
        productId,
        count: images.length,
      },
      'Uploaded all images to Cloudinary',
    );

    return images;
  }
}
