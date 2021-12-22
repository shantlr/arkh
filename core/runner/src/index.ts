import { io } from 'socket.io-client';
import { createLogger } from '@shantr/metro-logger';

import { config } from './config';
import { EventManager, EVENTS } from './events';
import { loadConfig } from './data/loadConfig';
import { State } from './data';
import { ServiceSpec } from '@shantr/metro-common-types';
import { SideEffects } from './events/sideEffects';
import { map } from 'lodash';

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

  socket.on('force-runner-exit', ({ reason }: { reason: string }) => {
    logger.error(`server is forcing runner to exit: ${reason}`);
    socket.disconnect();
    process.exit(1);
  });

  socket.on(
    'run-service',
    ({ name, spec }: { name: string; spec: ServiceSpec }, callback) => {
      logger.info(`assigned '${name}'`);
      EventManager.push(EVENTS.tasks.run({ name, spec }));
      callback({ success: true });
    }
  );
  socket.on('remove-service', ({ name }: { name: string }) => {
    EventManager.push(EVENTS.tasks.remove({ name }));
  });

  // Side effects
  SideEffects.on('taskStateUpdate', (data) => {
    socket.emit('task-state', data);
  });
  SideEffects.on('taskStdout', (data) => {
    socket.emit('task-stdout', data);
  });
  SideEffects.on('taskStderr', (data) => {
    socket.emit('task-stderr', data);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log('signal', signal);
    console.log('shutting down...');
    try {
      // First stop all running tasks
      await Promise.all(
        map(State.service.all(), async (service) => {
          if (service.task.isRunning()) {
            await service.task.stop('shutting-down');
          }
        })
      );
      console.log('all task stopped');

      await new Promise((resolve) => setTimeout(resolve));

      // tell server that we are leaving
      let timeout = null;
      await Promise.race([
        new Promise<void>((resolve) => {
          socket.emit('runner-leave', { reason: 'shutting-down' }, () => {
            resolve();
          });
        }),
        // timeout
        new Promise<void>((resolve) => {
          timeout = setTimeout(() => {
            console.log(`sending runner-leave timeout`);
            resolve();
          }, 5 * 1000);
        }),
      ]);

      clearTimeout(timeout);
      socket.close();

      console.log('socket gracefully closed');
    } finally {
      process.exit(1);
    }
  };
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGQUIT', gracefulShutdown);
  process.on('SIGUSR2', gracefulShutdown);
};

main().catch((err) => {
  throw err;
});
