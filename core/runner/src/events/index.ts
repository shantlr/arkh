import { EventQueue } from '@shantr/metro-queue';
import { tasks } from './consumers/tasks';

export const EVENTS = {
  tasks,
};

export const EventManager = new EventQueue();
EventManager.addQueues(tasks);
