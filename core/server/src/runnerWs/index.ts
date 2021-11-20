import { Server } from 'socket.io';

import { config } from 'src/config';
import { State } from 'src/data/state';
import { EventManager, EVENTS } from 'src/events';
import { createLogger } from '@shantr/metro-logger';
import { RunnerType } from './class';

export const startRunnerWs = async ({
  logger = createLogger('runner'),
} = {}) => {
  const io = new Server({});

  io.on('connection', (socket) => {
    let runnerId = null;
    socket.on('runner-ready', (event: { id: string; type: RunnerType }) => {
      runnerId = event.id;

      State.runner.ready({
        id: event.id,
        type: event.type,
        socket,
      });

      EventManager.push(
        EVENTS.runner.joined({
          runnerId,
        })
      );
    });

    socket.on('disconnect', () => {
      logger.info('disconnected');
      if (runnerId) {
        State.runner.disconnected(runnerId);
      }
    });

    socket.on(
      'task-state',
      ({ serviceName, state }: { serviceName: string; state: string }) => {
        const service = State.service.get(serviceName);
        if (!service) {
          logger.info(
            `task-state not updated: service '${serviceName}' not found`
          );
          return;
        }

        switch (state) {
          case 'creating': {
            State.service.toTaskCreating(serviceName);
            break;
          }
          case 'running': {
            State.service.toTaskRunning(serviceName);
            break;
          }
          case 'stopping': {
            State.service.toTaskStopping(serviceName);
            break;
          }
          case 'stopped': {
            State.service.toTaskStopped(serviceName);
            break;
          }
          case 'exited': {
            State.service.toTaskExited(serviceName);
            break;
          }
          default:
        }
      }
    );
    socket.on(
      'task-stdout',
      ({ serviceName, log }: { serviceName: string; log: string }) => {
        console.log('log', serviceName, log);
      }
    );
    socket.on(
      'task-stderr',
      ({ serviceName, log }: { serviceName: string; log: string }) => {
        console.log('err', serviceName, log);
      }
    );
  });

  io.listen(config.get('runner.port'));
  logger.info(`Listening to ws://localhost:${config.get('runner.port')}`);
};
