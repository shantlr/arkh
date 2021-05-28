export const CLIENT_ROOMS = {
  commands: 'subscribe-commands',
  runnerAvailable: 'subscribe-runner-available',
  commandTasks: (commandId) => `subscribe-command-tasks:${commandId}`,
  taskLogs: (taskid) => `subscribe-task-logs:${taskid}`,
};

export const CLIENT_PUBLISH = {
  command: 'publish-command',
  commandTask: (commandId) => `publish-command-task:${commandId}`,
  taskLogs: (taskId) => `publish-task-logs:${taskId}`,
  runnerAvailable: 'publish-runner-available',
};
