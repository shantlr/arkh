import { startApi } from './api';
import { config } from './config';
import { doMigrations } from './data';
import { EVENTS, EventManager } from './events';
import { startRunnerWs } from './runnerWs';

const main = async (): Promise<void> => {
  await doMigrations();

  EventManager.startConsumeEvent();
  EventManager.push(EVENTS.load.dir(config.get('configs.path')));

  await startRunnerWs();
  await startApi(config.get('api.port'));
};
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
