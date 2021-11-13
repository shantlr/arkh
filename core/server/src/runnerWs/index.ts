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
    socket.on('runner-ready', (event: { id: string; type: RunnerType }) => {
      console.log(event);

      State.runner.ready({
        id: event.id,
        type: event.type,
        socket,
      });
      EventManager.push(
        EVENTS.runner.joined({
          runnerId: event.id,
        })
      );
    });

    socket.on('disconnect', () => {
      logger.info('disconnected');
      State.runner.disconnected(socket.id);
    });
  });

  io.listen(config.get('runner.port'));
  logger.info(`Listening to ws://localhost:${config.get('runner.port')}`);
};
