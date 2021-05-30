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
  debug('runner connected');

  socket.on('disconnect', () => {
    debug('runner disconnected');
    MESSAGES.runner.disconnected.publish(socket.id);
  });

  // Send all commands
  Command.getAll({ withTemplate: true }).then((cmds) => {
    cmds.forEach((cmd) => {
      socket.emit('update-command', cmd);
    });
  });

  socket.on('get-command', async (cmdId, reply) => {
    reply(await Command.getById(cmdId, { withTemplate: true }));
  });

  socket.on('task-started', async ({ id: taskId, started_at: date }) => {
    try {
      debug(`task '${taskId}' started`);
      await Task()
        .update({
          started_at: date,
        })
        .where({
          id: taskId,
          started_at: null,
        });

      const task = await Task.getById(taskId);
      MESSAGES.task.created.publish(task);
    } catch (err) {
      console.error(err);
    }
  });
  socket.on('task-stopped', async ({ id: taskId, result, ended_at: date }) => {
    await Task()
      .update({
        updated_at: new Date(),
        result: JSON.stringify(result),
        ended_at: date,
      })
      .where({
        id: taskId,
        ended_at: null,
      });

    const task = await Task.getById(taskId);
    MESSAGES.task.ended.publish(task);
    debug(`task '${taskId}' stopped`);
  });
  socket.on('task-log', async ({ id, log }) => {
    await TaskLog().insert({
      id: log.id,
      task_id: id,
      log: log.msg,
      level: log.level,
      date: log.date,
    });
    const createdLog = await TaskLog.getById(log.id);
    MESSAGES.task.logs.publish(createdLog);
    debug(`task '${id}' log`);
  });
};
