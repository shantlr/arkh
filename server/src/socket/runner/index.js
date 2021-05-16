import { Socket } from 'socket.io';
import { debug } from '../../config';
import { Command, Task, TaskLog } from '../../data';
import { MESSAGES } from '../../pubsub';

/**
 *
 * @param {Socket} socket
 */
export const setupRunnerSocket = (socket) => {
  MESSAGES.runner.connected.publish(socket.id);
  console.log('connect');

  socket.on('disconnect', () => {
    MESSAGES.runner.disconnected.publish(socket.id);
  });

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
      const [task] = await Task()
        .insert({
          id: start.id,
          command_id: start.command_id,
          created_at: new Date(),
          updated_at: new Date(),
          started_at: start.date,
        })
        .returning('*');
      MESSAGES.task.created.publish(task);
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

    const task = await Task.getById(stopped.id);
    MESSAGES.task.updated.publish(task);
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
};
