/**
 * Goal: to find relevant photos for each product based on the product's category from Unsplash API'
 * How many photos to fetch: Default 4
 * Regular photo size will be used
 * If Rate Limit is reached, wait and retry
 * Number of retries: 3 default (can be configured in the env file)
 * Time between retries: 500ms (can be configured in the env file)
 * If error occurs during the process, a structured log will be created
 * mappings :
 * t-shirts: "t-shirt apparel studio white background"
 * hoodies: "hoodie fashion studio isolated background"
 * sweaters: "sweater knitwear studio fashion shot"
 * denim: "denim jeans fashion studio isolated"
 * chinos: "chino pants fashion studio neutral background"
 * dresses: "dress fashion studio editorial isolated"
 * skirts: "skirt fashion studio minimal background"
 * blouses: "blouse fashion photo studio clean background"
 * shirts: "shirt menswear studio white background"
 * suits: "suit menswear studio portrait isolated"
 * jackets: "jacket fashion studio outerwear isolated"
 * coats: "coat fashion editorial studio white wall"
 * activewear: "activewear sportswear studio athletic apparel"
 * loungewear: "loungewear cozy clothing studio soft tones"
 * underwear: "underwear minimal fashion studio isolated"
 * socks: "socks pair apparel studio white background"
 * scarves: "scarf accessory fashion studio isolated"
 * hats: "hat cap fashion studio isolated background"
 * belts: "belt leather accessory studio product photo"
 * bags: "bag tote handbag studio product isolated"
 */

import * as axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { retry } from '../utils/retry';

const CATEGORY_QUERY_MAP: Record<string, string> = {
  't-shirts': 't-shirt apparel studio white background',
  hoodies: 'hoodie fashion studio isolated background',
  sweaters: 'sweater knitwear studio fashion shot',
  denim: 'denim jeans fashion studio isolated',
  chinos: 'chino pants fashion studio neutral background',
  dresses: 'dress fashion studio editorial isolated',
  skirts: 'skirt fashion studio minimal background',
  blouses: 'blouse fashion photo studio clean background',
  shirts: 'shirt menswear studio white background',
  suits: 'suit menswear studio portrait isolated',
  jackets: 'jacket fashion studio outerwear isolated',
  coats: 'coat fashion editorial studio white wall',
  activewear: 'activewear sportswear studio athletic apparel',
  loungewear: 'loungewear cozy clothing studio soft tones',
  underwear: 'underwear minimal fashion studio isolated',
  socks: 'socks pair apparel studio white background',
  scarves: 'scarf accessory fashion studio isolated',
  hats: 'hat cap fashion studio isolated background',
  belts: 'belt leather accessory studio product photo',
  bags: 'bag tote handbag studio product isolated',
};

type UnsplashSearchResponse = {
  total: number;
  total_pages: number;
  results: {
    id: string;
    urls: {
      regular: string;
      [key: string]: string;
    };
    [key: string]: any;
  }[];
};

export type UnsplashImageResult = {
  url: string;
};

export class UnsplashService {
  private readonly accessKey = env.unsplashAccessKey;
  private readonly querySize = env.unsplashQuerySize;

  private buildQuery(categorySlug: string): string {
    const base = CATEGORY_QUERY_MAP[categorySlug];
    if (!base) {
      logger.warn({ categorySlug }, 'No Unsplash query mapping found for category slug.');
      return `${categorySlug} apparel studio`;
    }
    return base;
  }

  private async makeUnsplashRequest(query: string) {
    const url = 'https://api.unsplash.com/search/photos';

    try {
      const response = await axios.get<UnsplashSearchResponse>(url, {
        params: {
          query,
          per_page: this.querySize,
        },
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
        timeout: 8000,
      });

      return response.data?.results;
    } catch (err: any) {
      const status = err?.response?.status;
      logger.error({ query, status }, 'Unsplash API request failed');
      throw err;
    }
  }

  async fetchImagesForCategory(categorySlug: string): Promise<UnsplashImageResult[]> {
    const query = this.buildQuery(categorySlug);

    logger.info({ categorySlug, query }, 'Fetching images from Unsplash for category');

    const results = await retry(() => this.makeUnsplashRequest(query), {
      operationName: 'unsplash-request',
    });

    if (!Array.isArray(results) || results.length == 0) {
      logger.warn({ categorySlug, query }, 'No images found in Unsplash response');
      return [];
    }

    const images: UnsplashImageResult[] = results
      .map((item: any) => ({
        url: item?.urls?.regular, // We are using a regular size image
      }))
      .filter((image) => Boolean(image.url));

    logger.info(
      { categorySlug, requested: this.querySize, received: images.length },
      'Unsplash images fetched successfully',
    );

    return images;
  }
}
