import { EventQueue } from '@shantr/metro-queue';
import { loadQueue } from './consumers/load';
import { runnerQueue } from './consumers/runner';
import { serviceQueue } from './consumers/service';
import { stackQueue } from './consumers/stack';

export const EVENTS = {
  load: loadQueue,
  stack: stackQueue,
  service: serviceQueue,
  runner: runnerQueue,
};

export const EventManager = new EventQueue();
EventManager.addQueues(loadQueue, stackQueue, serviceQueue, runnerQueue);
