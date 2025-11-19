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
import products from '../../data/products.json';
import categories from '../../data/categories.json';
import { promises as fs } from 'fs';
import path from 'path';
import { UnsplashService } from '../services/UnsplashService';
import { CloudinaryService } from '../services/CloudinaryService';
import { LaravelApiClient } from '../services/LaravelApiClient';
import { retry } from '../utils/retry';
import { logger } from '../utils/logger';

export class ImageIngestionWorker {
  private productsToProcess: any[] = [];
  private failedProducts: number[] = [];

  constructor() {
    // Parse CLI Flags
    const productFlag = process.argv.find((arg) => arg.startsWith('--products='));
    const useFailedFlag = process.argv.includes('--useFailed');

    // Targeted run (--products=1,2,3)
    if (productFlag) {
      const productIds = productFlag
        .split('=')[1]
        .split(',')
        .map((id) => Number(id.trim()));

      this.productsToProcess = products.filter((product: any) => productIds.includes(product.id));

      console.log(`Targeted run: Processing ${productIds.join(',')} products...`);
      return;
    }

    if (useFailedFlag) {
      try {
        const failedFile = require('../../data/failed-products.json');
        this.failedProducts = failedFile.failed || [];

        this.productsToProcess = products.filter((product: any) =>
          this.failedProducts.includes(product.id),
        );

        console.log(`Failed rerun: Reprocessing ${this.failedProducts.join(',')} products...`);
        return;
      } catch (error) {
        console.error('Failed to load failed-products.json:', error);
      }
    }

    this.productsToProcess = products;
    console.log('Full run: Processing all products...');
  }

  async run() {
    console.log(`Starting ingestion for ${this.productsToProcess.length} products...`);
    for (const product of this.productsToProcess) {
      console.log(`\n Processing product ${product.id}: ${product.name}...`);

      try {
        await this.processProduct(product);

        console.log(`Product ${product.id} processed successfully.`);
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);

        this.failedProducts.push(product.id);
      }
    }

    await this.writeFailedProducts();

    console.log('\n🏁 Ingestion completed.');
    console.log(`   ✔ Success: ${this.productsToProcess.length - this.failedProducts.length}`);
    console.log(`   ✖ Failed: ${this.failedProducts.length}\n`);

    if (this.failedProducts.length > 0) {
      console.log(`⚠️  You can retry failed products with:`);
      console.log(`   node index.js --products=${this.failedProducts.join(',')}\n`);
    }
  }

  async writeFailedProducts(): Promise<void> {
    // If there are no failed products, skip writing to failed-products.json
    if (this.failedProducts.length === 0) {
      console.log(`No failed products to write to failed-products.json.`);
      return;
    }

    // Clean duplicate ID's;
    const uniqueFailedProductIds = [...new Set(this.failedProducts)];
    const filePath = path.join(__dirname, '../../data/failed-products.json');
    const payload = { failed: uniqueFailedProductIds };

    try {
      await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
      console.log(`Failed products: ${uniqueFailedProductIds.join(', ')} written to ${filePath}. `);
    } catch (error) {
      console.error(`Error writing failed products to ${filePath}:`, error);
    }
  }

  async processProduct(product: any): Promise<void> {
    logger.info({ productId: product.id }, `Starting pipeline for product`);
    const unsplashService = new UnsplashService();
    const cloudinaryService = new CloudinaryService();
    const laravelApiClient = new LaravelApiClient();

    try {
      // Step 1: Fetch image URLs from Unsplash
      const categoryId = product.categories[0];
      const categorySlug: string = categories.find(
        (cat: { id: number; slug: string; name: string }) => cat.id === categoryId,
      )!.slug;
      const rawUrls = await retry(() => {
        return unsplashService.fetchImagesForCategory(categorySlug);
      });

      if (rawUrls.length === 0) {
        throw new Error('Unsplash returned zero images');
      }

      // Download + upload images to Cloudinary
      const uploadedImageUrls = await retry(() => {
        return cloudinaryService.uploadAll(rawUrls, product.id);
      });

      if (rawUrls.length !== uploadedImageUrls.length) {
        logger.warn(
          {
            productId: product.id,
            rawCount: rawUrls.length,
            uploadedCount: uploadedImageUrls.length,
          },
          'Number of uploaded images does not match the number of fetched images',
        );
        throw new Error('Failed to upload all images to Cloudinary');
      }

      await laravelApiClient.uploadProductImages(product.id, uploadedImageUrls);

      logger.info(
        { productId: product.id, count: uploadedImageUrls.length },
        'Images found and uploaded successfully.',
      );
    } catch (error) {
      logger.error({ productId: product.id, error }, 'Pipeline failed for product');
      throw error;
    }
  }
}
