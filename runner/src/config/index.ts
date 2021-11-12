import './env';
import convict from 'convict';

export const config = convict({
  service: {
    name: {
      env: 'SERVICE_NAME',
      default: 'metro-runner',
    },
  },
  server: {
    url: {
      env: 'SERVER_URL',
      default: 'ws://localhost:6077',
    },
  },
});
