import './env';
import convict from 'convict';

export const config = convict({
  api: {
    port: {
      env: 'API_PORT',
      default: 4077,
    },
  },
  configs: {
    path: {
      env: 'CONFIGS_PATH',
      default: './configs/',
    },
  },
  loki: {
    path: {
      env: 'LOKI_PATH',
      default: './data/db.loki',
    },
  },
});
