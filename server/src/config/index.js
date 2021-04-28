import convict from 'convict';

import './env';

export const config = convict({
  service: {
    port: {
      env: 'SERVICE_PORT',
      default: 3005,
    },
  },
  template: {
    directory: {
      env: 'TEMPLATE_DIRECTORY',
      default: './data/templates',
    },
  },
  directory: {
    env: 'HOME',
    default: '',
  },
  command: {
    directory: {
      env: 'COMMAND_DIRECTORY',
      default: './data/commands',
    },
  },
});
