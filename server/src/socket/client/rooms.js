export const CLIENT_ROOMS = {
  commands: 'subscribe-commands',
  runnerAvailable: 'subscribe-runner-available',
  commandLog: (commandId) => `subscribe-command-logs:${commandId}`,
};
