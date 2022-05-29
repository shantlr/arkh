import { Logger } from '@shantlr/shipyard-logger';
import { Request, Response } from 'express';
import { baseLogger } from '../../config';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      logger: Logger;
    }
  }
}

export const expressLogger = (loggerName = 'api') => {
  const logger = baseLogger.extend(loggerName);
  const l = logger.extend('mdw');
  return (req: Request, res: Response, next: () => void) => {
    req.logger = logger.prefix(`${req.method} ${req.originalUrl}`);
    l.info('started');

    res.on('close', () => {
      if (res.statusCode < 400) {
        l.info(`[${res.statusCode}]`);
      } else {
        l.error(`[${res.statusCode}]`);
      }
    });

    next();
  };
};
