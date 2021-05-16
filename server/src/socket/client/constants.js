export const CLIENT_ROOMS = {
  commands: 'subscribe-commands',
  runnerAvailable: 'subscribe-runner-available',
  commandLog: (commandId) => `subscribe-command-logs:${commandId}`,
};

export const CLIENT_PUBLISH = {
  command: 'publish-command',
  runnerAvailable: 'publish-runner-available',
};
