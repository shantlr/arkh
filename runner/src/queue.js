import Queue from 'queue';
import { getCommand, getTask, startTask } from './data';
import { debug } from './debug';

const cmdQueues = new Map();

/**
 *
 * @param {string} commandId
 * @returns {Queue}
 */
export const getCommandQueue = (commandId) => {
  if (!cmdQueues.has(commandId)) {
    const queue = new Queue({
      autostart: true,
    });
    cmdQueues.set(commandId, queue);
  }
  return cmdQueues.get(commandId);
};

export const CMD_JOBS = {
  getAndExec({ cmdId }) {
    return () => {};
  },
  exec({ socket, cmdId }) {
    return () => {
      const cmd = getCommand(cmdId);
      if (!cmd) {
        debug(`Command ${cmdId} not found`);
        return;
      }

      const existingTask = getTask(cmdId);
      if (existingTask) {
        debug(`Command ${cmd.name} task already ongoing`);
        return;
      }

      startTask({ socket, cmd });
    };
  },
  stop({ cmdId }) {
    return () => {
      const cmd = getCommand(cmdId);
      if (!cmd) {
        debug(`[stop] Command ${cmdId} not found`);
        return;
      }
      cmd.process.kill('SIGTERM');
    };
  },
};
