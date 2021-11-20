import { Request, Response } from 'express';
import { createLogger, Logger } from '@shantr/metro-logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      logger: Logger;
    }
  }
}

export const expressLogger = (loggerName = 'api') => {
  const logger = createLogger(loggerName);
  return (req: Request, res: Response, next: () => void) => {
    req.logger = logger.prefix(`${req.method} ${req.originalUrl}`);
    req.logger.info('started');

    res.on('close', () => {
      if (res.statusCode < 400) {
        req.logger.info(`[${res.statusCode}]`);
      } else {
        req.logger.error(`[${res.statusCode}]`);
      }
    });

    next();
  };
};
