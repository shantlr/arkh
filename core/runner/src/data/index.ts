import { createLogger } from '@shantr/metro-logger';
import { Task } from '../lib/task';

export type ServiceState = {
  name: string;
  task: Task;
};

const IN_MEMORY_STATE: {
  runner: {
    id: string;
  };
  service: {
    list: Record<string, ServiceState>;
  };
} = {
  runner: {
    id: null,
  },
  service: {
    list: {},
  },
};

const logger = createLogger('state');

export const State = {
  runner: {
    getId() {
      return IN_MEMORY_STATE.runner.id;
    },
    init(id: string) {
      if (IN_MEMORY_STATE.runner.id) {
        throw new Error(`Runner already inited`);
      }

      IN_MEMORY_STATE.runner.id = id;
      logger.info(`runner inited`);
    },
  },
  service: {
    all() {
      return IN_MEMORY_STATE.service.list;
    },
    get(name: string) {
      return IN_MEMORY_STATE.service.list[name];
    },
    add(state: ServiceState) {
      if (state.name in IN_MEMORY_STATE.service.list) {
        throw new Error(`service '${state.name}' already exists`);
      }

      IN_MEMORY_STATE.service.list[state.name] = state;
      logger.info(`service '${state.name}' added`);
    },
    remove(name: string) {
      const existing = State.service.get(name);
      if (existing && existing.task.isRunning()) {
        throw new Error(`cannot remove running task`);
      }
      delete IN_MEMORY_STATE.service.list[name];
      logger.info(`service '${name}' removed`);
    },
  },
};
