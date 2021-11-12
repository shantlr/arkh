import { io } from 'socket.io-client';
import { nanoid } from 'nanoid';

import { config } from './config';
import { createLogger } from './lib/logger';

const logger = createLogger('runner');

logger.info(`Connecting to metro server at ${config.get('server.url')}`);
const socket = io(`${config.get('server.url')}`);

const RUNNER_ID = nanoid();

socket.on('connect', () => {
  logger.info('connected');

  socket.emit('runner-ready', {
    id: RUNNER_ID,
    type: 'run-process',
  });
});

socket.on('connect_error', (err) => {
  logger.info('connect_error', err.message);
});
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    logger.info('disconnected by server, retrying connection in 3s');
    setTimeout(() => {
      socket.connect();
    }, 3000);
  } else {
    logger.info('disconnected %s', reason);
  }
});
socket.on('reconnect', () => {
  logger.info('reconnected');
});

socket.on('run-service', ({ serviceName }) => {
  //
});
socket.on('stop-service', ({ serviceName }) => {
  //
});
