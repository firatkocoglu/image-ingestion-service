/**
 * env loader will be called
 * logger will be initialized
 * fastify will be initialized
 * routes will be registered
 * start the server
 */
import 'dotenv/config';

import { logger } from './utils/logger';
import { ImageIngestionWorker } from './workers/ImageIngestionWorker';

// Log unhandled promise rejections and exceptions
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection detected');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception detected');
});

async function main() {
  try {
    logger.info('Starting image ingestion worker...');
    const worker = new ImageIngestionWorker();
    await worker.run();
    logger.info('Image ingestion worker started successfully.');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Image ingestion worker failed with an error');
    process.exit(1);
  }
}

main();
