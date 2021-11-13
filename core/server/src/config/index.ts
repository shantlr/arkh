import './env';
import convict from 'convict';

export const config = convict({
  api: {
    port: {
      env: 'API_PORT',
      default: 4077,
    },
  },
  runner: {
    port: {
      env: 'RUNNER_PORT',
      default: 6077,
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
