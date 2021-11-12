import { startTask, stopTask } from './data';
import { QueueManager } from './lib/queue';

export const commandTaskQueue = new QueueManager(
  async ({ data: { type, task } }) => {
    if (type === 'exec') {
      startTask(task);
    } else if (type === 'stop') {
      stopTask(task);
    }
  }
);

export const pushCommandTaskJob = (commandId, job) => {
  commandTaskQueue.push(commandId, job);
};

export const CMD_JOBS = {
  exec: (task) => ({
    id: `${task.id}:exec`,
    data: {
      type: 'exec',
      task,
    },
  }),
  stop: (task) => ({
    id: `${task.id}:stop`,
    data: {
      type: 'stop',
      task,
    },
  }),
};
