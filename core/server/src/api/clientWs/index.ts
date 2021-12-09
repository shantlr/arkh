import { Logger } from '@shantr/metro-logger';
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { SideEffects } from 'src/events/sideEffects';

const ROOMS = {
  subscription: {
    stacks: 'subscribe-stacks',
  },
};

export const startClientWs = ({
  httpServer,
  logger,
}: {
  httpServer: HttpServer;
  logger: Logger;
}) => {
  const io = new Server(httpServer, {});

  io.on('connection', (socket) => {
    logger.info(`client connected`, socket.id);

    socket.on('subscribe-stacks', async () => {
      logger.info(`${socket.id} subscribed to stacks`);
      await socket.join(ROOMS.subscription.stacks);
    });
    socket.on('unsubscribe-stacks', async () => {
      if (socket.in(ROOMS.subscription.stacks)) {
        logger.info(`${socket.id} unsubscribed to stacks`);
        await socket.leave(ROOMS.subscription.stacks);
      }
    });
  });

  io.on('disconnect', () => {
    logger.info(`client disconnected`);
  });

  SideEffects.on('addStack', ({ name }) => {
    console.log('ADD_STACKS');
    io.in(ROOMS.subscription.stacks).emit('stack-event', {
      type: 'add-stack',
      name,
    });
  });
  SideEffects.on('updateStack', ({ name }) => {
    io.in(ROOMS.subscription.stacks).emit('stack-event', {
      type: 'update-stack',
      name,
    });
  });
  SideEffects.on('removeStack', ({ name }) => {
    io.in(ROOMS.subscription.stacks).emit('stack-event', {
      type: 'remove-stack',
      name,
    });
  });
};
