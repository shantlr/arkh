import './env';
import convict from 'convict';
import { createLogger } from '@arkh/logger';

export const config = convict({
  service: {
    name: {
      env: 'SERVICE_NAME',
      default: 'metro-runner',
    },
  },
  config: {
    path: {
      env: 'CONFIG_PATH',
      default: '~/.config/metro-runner/config.json',
    },
  },
  server: {
    url: {
      env: 'SERVER_URL',
      default: 'ws://localhost:6077',
    },
  },
});

export const baseLogger = createLogger('shipyard');
