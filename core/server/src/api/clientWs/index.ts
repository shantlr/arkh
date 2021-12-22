import {
  SocketIOClientToServerEvents,
  SocketIOServerToClientEvents,
} from '@shantr/metro-common-types';
import { Logger } from '@shantr/metro-logger';
import { Server as HttpServer } from 'http';
import { forEach } from 'lodash';
import { Server } from 'socket.io';
import { Service, Task } from 'src/data';
import { State } from 'src/data/state';
import { SideEffects } from 'src/events/sideEffects';
import {
  ROOMS,
  SUBCRIBE_PREFIX,
  SUBSCRIPTIONS,
  UNSUBSCRIBE_PREFIX,
} from './rooms';

export const startClientWs = ({
  httpServer,
  logger,
}: {
  httpServer: HttpServer;
  logger: Logger;
}) => {
  const io = new Server<
    SocketIOClientToServerEvents,
    SocketIOServerToClientEvents
  >(httpServer, {});

  io.on('connection', (socket) => {
    logger.info(`client connected`, socket.id);

    // setup listener on subscription events
    forEach(SUBSCRIPTIONS, (sub, subKey) => {
      if (typeof sub === 'string') {
        const subEventName = `${SUBCRIBE_PREFIX}-${sub}`;
        const unsubEventName = `${UNSUBSCRIBE_PREFIX}-${sub}`;
        // @ts-ignore
        socket.on(subEventName, async () => {
          const roomName = ROOMS.subscription[subKey];
          if (!socket.rooms.has(roomName)) {
            await socket.join(roomName);
            logger.info(`${socket.id} subscribed to ${sub}`);
          }
        });
        // @ts-ignore
        socket.on(unsubEventName, async () => {
          const roomName = ROOMS.subscription[subKey];
          if (socket.rooms.has(roomName)) {
            await socket.leave(roomName);
            logger.info(`${socket.id} unsubscribed to ${sub}`);
          }
        });
      } else {
        const subEventName = `${SUBCRIBE_PREFIX}-${sub.key}`;
        const unsubEventName = `${UNSUBSCRIBE_PREFIX}-${sub.key}`;
        type Params = Parameters<typeof sub.params>;
        // @ts-ignore
        socket.on(subEventName, async (...params: Params) => {
          const roomName = ROOMS.subscription[subKey](...params);
          if (!socket.rooms.has(roomName)) {
            logger.info(`${socket.id} subscribed to ${sub.key}`);
            await socket.join(roomName);
          }
        });
        // @ts-ignore
        socket.on(unsubEventName, async (...params: Params) => {
          const roomName = ROOMS.subscription[subKey](...params);
          if (socket.rooms.has(roomName)) {
            logger.info(`${socket.id} unsubscribed to ${sub.key}`);
            await socket.leave(roomName);
          }
        });
      }
    });
  });

  io.on('disconnect', () => {
    logger.info(`client disconnected`);
  });

  SideEffects.on('addStack', ({ name }) => {
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

  SideEffects.on('updateServiceState', ({ serviceName }) => {
    const { stackName, serviceKey } = Service.splitFullName(serviceName);
    const state = State.service.get(serviceName);
    io.in(ROOMS.subscription.serviceStates(stackName)).emit(
      `update-service-state:${stackName}`,
      {
        serviceName,
        stackName,
        serviceKey,
        state,
      }
    );
  });

  SideEffects.on('addTask', async ({ id, serviceName }) => {
    const task = await Task.get(id);
    io.in(ROOMS.subscription.serviceTasks(serviceName)).emit(
      `service-task:${serviceName}`,
      {
        type: 'add-task',
        task,
      }
    );
  });
  SideEffects.on('updateTask', async (taskStateUpdate) => {
    const task = await Task.get(taskStateUpdate.id);
    io.in(ROOMS.subscription.serviceTasks(task.service_name)).emit(
      `service-task:${task.service_name}`,
      {
        type: 'update-task',
        taskStateUpdate,
      }
    );
  });
  SideEffects.on('taskLog', async (log) => {
    io.in(ROOMS.subscription.taskLogs(log.task_id)).emit(
      `task-log:${log.task_id}`,
      log
    );
  });

  return () => {
    io.disconnectSockets();
    logger.info('all client socket disconnected');
    io.close();
    logger.info('client socketio closed');
  };
};
