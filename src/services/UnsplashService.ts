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

import axios from 'axios';
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

  private async makeUnsplashRequest(
    query: string,
    querySize: number = this.querySize,
    page: number = 1,
  ): Promise<{ pages: number; results: UnsplashSearchResponse['results'] }> {
    const url = 'https://api.unsplash.com/search/photos';

    try {
      const response = await axios.get<UnsplashSearchResponse>(url, {
        params: {
          query,
          page,
          per_page: 30,
        },
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
        timeout: 8000,
      });

      console.log(response.data);

      return {
        pages: response.data.total_pages,
        results: response.data?.results,
      };
    } catch (err: any) {
      const status = err?.response?.status;
      logger.error({ query, status }, 'Unsplash API request failed');
      throw err;
    }
  }

  async fetchImagesForCategory(categorySlug: string, remaining: number = 4): Promise<string[]> {
    const query = this.buildQuery(categorySlug);

    logger.info({ categorySlug, query }, 'Fetching images from Unsplash for category');

    const images: string[] = [];

    const response = await retry(() => this.makeUnsplashRequest(query, remaining), {
      operationName: 'unsplash-request',
    });
    const { pages, results } = response;

    if (!Array.isArray(results) || results.length == 0) {
      logger.warn({ categorySlug, query }, 'No images found in Unsplash response');
      return [];
    }

    images.push(...results.map((item: any) => item?.urls?.regular));

    if (pages > 1) {
      const pageLimit = Math.min(pages, 10);
      for (let i = 2; i <= pageLimit; i++) {
        console.log('fetching page: ' + i);
        const response = await retry(() => this.makeUnsplashRequest(query, remaining, i), {
          operationName: 'unsplash-request',
        });
        images.push(...response.results.map((item: any) => item?.urls?.regular));
      }
    }

    logger.info(
      { categorySlug, requested: this.querySize, received: images.length },
      'Unsplash images fetched successfully',
    );

    console.log('Fetched Unsplash images:', images);

    return images;
  }
}
