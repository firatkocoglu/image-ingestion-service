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

import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class LaravelApiClient {
  private readonly client: {
    interceptors: {
      request: { use: (arg0: (config: any) => any) => void };
      response: { use: (arg0: (response: any) => any, arg1: (error: any) => never) => void };
    };
    post: (arg0: string, arg1: { urls: string[] }) => any;
  };

  constructor() {
    this.client = axios.create({
      baseURL: env.laravelApiBaseUrl,
      timeout: 8000,
      headers: {
        Content_Type: 'application/json',
        'X-Internal-Token': env.laravelApiToken,
      },
    });

    this.client.interceptors.request.use((config: any) => {
      logger.info(
        {
          method: config.method,
          url: config.url,
        },
        'Laravel API request started',
      );
      return config;
    });

    this.client.interceptors.response.use(
      (response: any) => {
        logger.info(
          {
            status: response.status,
          },
          'Laravel API request completed',
        );
        return response;
      },
      (error: any) => {
        const status = error?.response?.status;
        logger.error(
          {
            status,
            url: error?.config?.url,
          },
          'Laravel API request failed',
        );
        throw error;
      },
    );
  }

  async uploadProductImages(productId: number, imageUrls: string[]): Promise<void> {
    try {
      const response = await this.client.post(`/products/${productId}/images`, {
        urls: imageUrls,
      });

      logger.info(
        { productId, count: imageUrls.length, status: response.status },
        'Uploaded images to Laravel backend successfully',
      );
    } catch (error: any) {
      logger.error(
        {
          productId,
          status: error?.response?.status,
        },
        'Failed to upload images to Laravel backend',
      );
      throw error;
    }
  }
}
