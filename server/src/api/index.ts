import express from 'express';
import { createLogger } from 'src/lib/logger';

export const startApi = async (port: number, logger = createLogger('api')) => {
  const app = express();

  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      logger.info(`listening on http://localhost:${port}`);
      resolve();
    });
  });
};
