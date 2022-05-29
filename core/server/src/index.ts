import { toLower } from 'lodash';
import path from 'path';
import sane from 'sane';

import { startApi } from './api';
import { baseLogger, config } from './config';
import { doMigrations } from './data';
import { startRunnerWs } from './runnerWs';
import { configsWorkflow } from './workflow';

const main = async (): Promise<void> => {
  await doMigrations();

  configsWorkflow.actions.syncDir(config.get('configs.path'));

  if (toLower(config.get('configs.watch')) === 'true') {
    const watchLogger = baseLogger.extend('file-watcher');

    const watcher = sane(config.get('configs.path'), {
      glob: ['**/*.yaml', '**/*.yml'],
    });
    watcher.on('ready', () => {
      watchLogger.info(
        `watching config files in '${path.resolve(config.get('configs.path'))}'`
      );
    });
    watcher.on('add', (filename, root) => {
      const filepath = path.resolve(root, filename);
      watchLogger.info(`${root}/${filepath} added`);
      configsWorkflow.actions.loadFile(filepath);
    });
    watcher.on('change', (filename, root) => {
      const filepath = path.resolve(root, filename);
      watchLogger.info(`${filepath} updated`);
      configsWorkflow.actions.loadFile(filepath);
    });
    watcher.on('delete', (filename, root) => {
      const filepath = path.resolve(root, filename);
      watchLogger.info(`${filepath} deleted`);
      configsWorkflow.actions.delete(filename);
    });
  }

  const shutRunnerWs = await startRunnerWs();
  const shutApi = await startApi(config.get('api.port'));

  const gracefulShutdown = async (signal: string) => {
    console.log('signal', signal);
    console.log('shutting down...');
    try {
      await shutRunnerWs();
      await shutApi();
    } finally {
      process.exit(1);
    }
  };

  process.on('SIGUSR2', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGQUIT', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
