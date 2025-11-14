import { env } from '../config/env';
import { logger } from './logger';

type RetryOptions = {
  attempts?: number;
  backoffMs?: number;
  factor?: number; // Exponential backoff factor
  operationName?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    attempts = env.retryAttempts,
    backoffMs = env.retryBackoffMs,
    factor = 2,
    operationName = 'operation',
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // Try the operation
      return await operation();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === attempts;

      if (isLastAttempt) {
        // If the last attempt fails, throw there error
        logger.error({ operationName, attempt, error }, 'Operation failed after all retries');
        throw error;
      }
      // Amount of time to wait before retrying
      const waitMs = backoffMs * Math.pow(factor, attempt - 1);

      logger.warn({ operationName, attempt, waitMs }, 'Retrying operation due to error');

      await sleep(waitMs);
    }
  }

  throw lastError ?? new Error(`Operation ${operationName} failed after all retries`);
}
