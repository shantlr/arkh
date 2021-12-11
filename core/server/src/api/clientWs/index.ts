import { Logger } from '@shantr/metro-logger';
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { Service } from 'src/data';
import { State } from 'src/data/state';
import { SideEffects } from 'src/events/sideEffects';

const ROOMS = {
  subscription: {
    stacks: 'subscribe-stacks',
    stackServiceStates: (stackName: string) =>
      `subscribe-stack-service-states:${stackName}`,
    task: (id: string) => `subscribe-task:${id}`,
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

    socket.on('subscribe-stacks', async () => {
      logger.info(`${socket.id} subscribed to services`);
      await socket.join(ROOMS.subscription.stacks);
    });
    socket.on('unsubscribe-stacks', async () => {
      if (socket.in(ROOMS.subscription.stacks)) {
        logger.info(`${socket.id} unsubscribed to services`);
        await socket.leave(ROOMS.subscription.stacks);
      }
    });

    socket.on('subscribe-stack-service-states', async (stackName: string) => {
      logger.info(
        `${socket.id} subscribed to stack '${stackName}' service states`
      );
      await socket.join(ROOMS.subscription.stackServiceStates(stackName));
    });
    socket.on('unsubscribe-stack-service-states', async (stackName: string) => {
      const room = ROOMS.subscription.stackServiceStates(stackName);
      if (socket.in(room)) {
        logger.info(
          `${socket.id} unsubscribed to stack '${stackName}' service states`
        );
        await socket.leave(room);
      }
    });

    socket.on('subscribe-task', async (taskId: string) => {
      const room = ROOMS.subscription.task(taskId);
      logger.info(`${socket.id} subscribe to task '${taskId}'`);
      await socket.join(room);
    });
    socket.on('unsubscribe-task', async (taskId: string) => {
      const room = ROOMS.subscription.task(taskId);
      if (socket.in(room)) {
        logger.info(`${socket.id} unsubscribe to task '${taskId}'`);
        await socket.leave(room);
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

  SideEffects.on('updateServiceState', ({ fullName }) => {
    const { stackName, serviceName } = Service.splitFullName(fullName);
    const state = State.service.get(fullName);
    io.in(ROOMS.subscription.stackServiceStates(stackName)).emit(
      `update-stack-service-state:${stackName}`,
      {
        fullName,
        stackName,
        serviceName,
        state,
      }
    );
  });

  // SideEffects.on('addService', ({ stackName, fullName }) => {
  //   io.in(ROOMS.subscription.services).emit('service-event', {
  //     type: 'add-service',
  //     stackName,
  //     fullName,
  //   });
  // });
  // SideEffects.on('removeService', ({ stackName, fullName }) => {
  //   io.in(ROOMS.subscription.services).emit('service-event', {
  //     type: 'remove-service',
  //     stackName,
  //     fullName,
  //   });
  // });
  // SideEffects.on('updateService', ({ stackName, fullName }) => {
  //   io.in(ROOMS.subscription.services).emit('service-event', {
  //     type: 'update-service',
  //     stackName,
  //     fullName,
  //   });
  // });
};
