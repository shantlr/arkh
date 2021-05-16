import EventEmitter from 'events';

const eventEmitter = new EventEmitter();

const pubsub = {
  subscribe(topic, listener) {
    eventEmitter.addListener(topic, listener);
    return () => {
      eventEmitter.removeListener(topic, listener);
    };
  },
  publish(topic, message) {
    eventEmitter.emit(topic, message);
  },
};

export const createBase = (key) => {
  return {
    key,
    publish(item) {
      return pubsub.publish(key, item);
    },
    subscribe(listener) {
      return pubsub.subscribe(key, listener);
    },
  };
};

export const MESSAGES = {
  command: {
    created: createBase('command-created'),
    updated: createBase('command-updated'),
    deleted: createBase('command-deleted'),
    logs: createBase('command-logs'),
  },
  task: {
    created: createBase('task-created'),
    updated: createBase('task-updated'),
    deleted: createBase('task-deleted'),
  },
  template: {
    created: createBase('template-created'),
    updated: createBase('template-updated'),
    deleted: createBase('template-deleted'),
  },

  runner: {
    connected: createBase('runner-connected'),
    disconnected: createBase('runner-disconnected'),
  },
};
