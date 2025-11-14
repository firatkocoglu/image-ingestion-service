/**
 * This logger is used to log all the errors and warnings
 * This logger will be used in the future to send the logs to a centralized logging service
 * This logger will include a pino instance
 * This logger supports different log levels: info, warn, error
 * This logger will differentiate between dev and prod environments
 */

import { pino } from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
    level: isDev ? 'debug' : 'info',
    transport: isDev ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }
    } : undefined,
});