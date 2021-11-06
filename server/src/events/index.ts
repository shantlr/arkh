import { EventQueue } from '../lib/queue';
import { loadQueue } from './consumers/loadConfig';
import { serviceQueue } from './consumers/service';
import { stackQueue } from './consumers/stack';

export const EVENTS = {
  load: loadQueue,
  stack: stackQueue,
  service: serviceQueue,
};

export const EventManager = new EventQueue();
EventManager.addQueues(loadQueue, stackQueue, serviceQueue);
