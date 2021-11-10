import express from 'express';
import { createLogger } from 'src/lib/logger';
import { stackRouter } from './routes/stack';

export const startApi = async (port: number, logger = createLogger('api')) => {
  const app = express();

  return new Promise<void>((resolve) => {
    app.use('/api/stack', stackRouter());

    app.listen(port, () => {
      logger.info(`listening on http://localhost:${port}`);
      resolve();
    });
  });
};
