import { toLower } from 'lodash';
import gaze from 'gaze';
import path from 'path';

import { startApi } from './api';
import { config } from './config';
import { doMigrations } from './data';
import { EVENTS, EventManager } from './events';
import { startRunnerWs } from './runnerWs';
import { createLogger } from '@shantr/metro-logger';

const main = async (): Promise<void> => {
  await doMigrations();

  EventManager.push(EVENTS.load.dir(config.get('configs.path')));

  if (toLower(config.get('configs.watch')) === 'true') {
    const watchLogger = createLogger('file-watcher');

    gaze(
      [
        `${config.get('configs.path')}/**/*.yaml`,
        `${config.get('configs.path')}/**/*.yml`,
      ],
      {},
      function (err, watcher) {
        if (err) {
          watchLogger.error(err.message);
        } else {
          this.on('added', (filepath: string) => {
            EventManager.push(EVENTS.load.file(filepath));
          });
          this.on('deleted', (filepath: string) => {
            console.log('FILE REMOVED', filepath);
          });
          this.on('changed', (filepath: string) => {
            EventManager.push(EVENTS.load.file(filepath));
          });
        }
      }
    );
    watchLogger.info(
      `watching config files in '${path.resolve(config.get('configs.path'))}'`
    );
  }
  EventManager.startConsumeEvent();

  await startRunnerWs();
  await startApi(config.get('api.port'));
};
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
