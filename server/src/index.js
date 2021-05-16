import 'regenerator-runtime';
import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import cors from 'cors';

import { config } from './config';

import { createSocketServer } from './socket';
import { createApiRouter } from './routes';

const main = async () => {
  const app = express();
  app.use(cors(), bodyParser.json());

  const httpServer = createServer(app);
  const { io } = await createSocketServer(httpServer);

  app.get('/', (req, res) => {
    res.redirect('/app');
  });

  app.use('/api', createApiRouter({ io }));

  const server = httpServer.listen(config.get('service.port'), () => {
    console.log(`Listening to http://localhost:${config.get('service.port')}/`);
  });
  process.once('SIGUSR2', () => {
    // Disconnect all client sockets
    io.sockets.sockets.forEach((socket) => {
      socket.disconnect();
    });
    // Disconnect all runner sockets
    io.of('runner').sockets.forEach((socket) => {
      socket.disconnect();
    });

    server.close(() => {
      console.log('Exiting...');
      process.exit(1);
    });
  });
};
main();
