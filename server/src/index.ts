import { startApi } from './api';
import { config } from './config';
import { doMigrations } from './data';
import { EVENTS, EventManager } from './events';

const main = async (): Promise<void> => {
  await doMigrations();
  // console.log('sERVICES', Service.getAll());

  EventManager.startConsumeEvent();
  EventManager.push(EVENTS.load.dir(config.get('configs.path')));

  await startApi(config.get('api.port'));
};
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
