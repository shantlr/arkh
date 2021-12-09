import { createServer } from 'http';
import express from 'express';
import cors from 'cors';

import { createLogger } from '@shantr/metro-logger';
import { expressLogger } from './middlewares/logger';
import { stackRouter } from './routes/stack';
import { serviceRouter } from './routes/service';
import { config } from 'src/config';
import { serviceTaskRouter } from './routes/serviceTask';
import { startClientWs } from './clientWs';

export const startApi = async (port: number, logger = createLogger('api')) => {
  const app = express();
  app.use(
    cors({
      origin: config.get('api.cors.origin'),
    }),
    expressLogger()
  );
  app.use('/api/stack', stackRouter());
  app.use('/api/service', serviceRouter());
  app.use('/api/service-task', serviceTaskRouter());

  const httpServer = createServer(app);
  startClientWs({
    httpServer,
    logger: logger.extend('ws'),
  });

  return new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      logger.info(`listening on http://localhost:${port}`);
      logger.info(`listening on ws://localhost:${port}`);
      resolve();
    });
  });
};
