import { startApi } from './api';
import { config } from './config';
import { EVENTS, EventManager } from './events';

const main = async () => {
  EventManager.startConsumeEvent();
  EventManager.push(EVENTS.load.dir(config.get('configs.path')));

  await startApi(config.get('api.port'));
};
main();
