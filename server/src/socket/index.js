import { reduce } from 'lodash';
import { Server } from 'socket.io';
import { debug } from '../config';
import { Command, Task, TaskLog } from '../data';
import { cmdLogs, cmdState } from './subscriptions/command';

export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    path: '/socket',
    cors: {
      origin: '*',
    },
  });

  const subscriptions = {
    cmdState,
    cmdLogs,
  };
  const subKeys = reduce(
    subscriptions,
    (acc, sub) => {
      if (acc[sub.key]) {
        throw new Error(`${sub.key} subscription key already used`);
      }

      acc[sub.key] = sub;
      return acc;
    },
    {}
  );

  // Client socket
  io.on('connection', (socket) => {
    console.log(socket.id, 'connected');

    socket.on('subscribe', ({ key, args }) => {
      const sub = subKeys[key];
      if (!sub) {
        console.warn(`[subscribe] Subscription key not found '${key}'`);
        return;
      }

      sub.join({ socket, args });
    });
    socket.on('unsubscribe', ({ key, args }) => {
      const sub = subKeys[key];
      if (!sub) {
        console.warn(`[unsubscribe] Subscription key not found '${key}'`);
        return;
      }

      sub.leave({ socket, args });
    });
  });

  // Runner
  io.of('runner').on('connection', (socket) => {
    console.log(socket.id, 'connected to runner');
    // Send all commands
    Command.getAll({ withTemplate: true }).then((cmds) => {
      cmds.forEach((cmd) => {
        socket.emit('update-command', cmd);
      });
    });

    socket.on('get-command', async (cmdId, cb) => {
      cb(await Command.getById(cmdId, { withTemplate: true }));
    });

    socket.on('task-started', async (start) => {
      try {
        debug(`task '${start.id}' started`);
        await Task().insert({
          id: start.id,
          command_id: start.command_id,
          created_at: new Date(),
          updated_at: new Date(),
          started_at: start.date,
        });
      } catch (err) {
        console.error(err);
      }
    });
    socket.on('task-stopped', async (stopped) => {
      await Task()
        .update({
          updated_at: new Date(),
          result: stopped.result,
          ended_at: stopped.date,
        })
        .where({
          id: stopped.id,
          ended_at: null,
        });
      debug(`task '${stopped.id}' stopped`);
    });
    socket.on('task-log', async ({ id, log }) => {
      await TaskLog().insert({
        id: log.id,
        task_id: id,
        log: log.msg,
        level: log.level,
        date: log.date,
      });
      debug(`task '${id}' log`);
    });
  });

  return { io, subscriptions };
};
