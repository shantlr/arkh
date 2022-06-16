import './env';
import convict from 'convict';
import { createLogger } from '@arkh/logger';

export const config = convict({
  api: {
    port: {
      env: 'API_PORT',
      default: 4077,
    },
    cors: {
      origin: {
        env: 'CORS_ORIGIN',
        default: 'http://localhost:3000',
      },
    },
  },
  runner: {
    port: {
      env: 'RUNNER_PORT',
      default: 6077,
    },
  },
  configs: {
    watch: {
      env: 'CONFIGS_WATCH',
      default: 'true',
    },
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
  db: {
    path: {
      env: 'DB_PATH',
      default: './data/db.sqlite',
    },
    migrations: {
      directory: {
        env: 'DB_MIGRATIONS_DIRECTORY',
        default: './migrations',
      },
    },
  },
});

export const baseLogger = createLogger('shipyard');
