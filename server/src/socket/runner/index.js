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

      const task = await Task.getById(start.id);
      MESSAGES.task.created.publish(task);
    } catch (err) {
      console.error(err);
    }
  });
  socket.on('task-stopped', async (stopped) => {
    await Task()
      .update({
        updated_at: new Date(),
        result: JSON.stringify(stopped.result),
        ended_at: stopped.date,
      })
      .where({
        id: stopped.id,
        ended_at: null,
      });

    const task = await Task.getById(stopped.id);
    MESSAGES.task.ended.publish(task);
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
    const createdLog = await TaskLog.getById(log.id);
    MESSAGES.task.logs.publish(createdLog);
    debug(`task '${id}' log`);
  });
};
