import { io } from 'socket.io-client';
import { createLogger } from '@shantr/metro-logger';

import { config } from './config';
import { EventManager, EVENTS } from './events';
import { loadConfig } from './data/loadConfig';
import { State } from './data';
import { ServiceSpec } from '@shantr/metro-common-types';
import { SideEffects } from './events/sideEffects';

const logger = createLogger('runner');

const main = async () => {
  loadConfig();
  EventManager.startConsumeEvent();

  logger.info(`Connecting to metro server at ${config.get('server.url')}`);
  const socket = io(`${config.get('server.url')}`);

  socket.on('connect', () => {
    logger.info('connected');

    socket.emit('runner-ready', {
      id: State.runner.getId(),
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

  socket.on(
    'run-service',
    ({ name, spec }: { name: string; spec: ServiceSpec }) => {
      EventManager.push(EVENTS.tasks.run({ name, spec }));
    }
  );
  socket.on('remove-service', ({ name }: { name: string }) => {
    EventManager.push(EVENTS.tasks.remove({ name }));
  });

  // Side effects
  SideEffects.on('taskStateUpdate', (data) => {
    socket.send('task-state', data);
  });
  SideEffects.on('taskStdout', (data) => {
    socket.send('task-stdout', data);
  });
  SideEffects.on('taskStderr', (data) => {
    socket.send('task-stderr', data);
  });
};

main().catch((err) => {
  throw err;
});
