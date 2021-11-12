import { filter, some } from 'lodash';
import { Socket } from 'socket.io';
import { createLogger } from 'src/lib/logger';
import { Runner, RunnerType } from 'src/runnerWs/class';

export type ServiceStateEnum =
  | 'off'
  | 'running'
  | 'assigned'
  | 'pending-assignment';
export type ServiceState = {
  name: string;
  state: ServiceStateEnum;
  assignedRunnerId?: string;
};

const IN_MEMORY_STATE: {
  stack: {
    //
  };
  service: {
    list: Record<string, ServiceState>;
  };
  runner: {
    list: Record<string, Runner>;
    roundRobins: {
      [key in RunnerType]: {
        ids: string[];
        cursor: number;
      };
    };
  };
} = {
  stack: {
    //
  },
  service: {
    list: {},
  },
  runner: {
    list: {},
    roundRobins: {
      'run-process': {
        ids: [],
        cursor: 0,
      },
    },
  },
};

const logger = createLogger('state');
export const State = {
  logs: {},
  service: {
    get(name: string) {
      return IN_MEMORY_STATE.service.list[name];
    },
    init(state: ServiceState) {
      if (state.name in IN_MEMORY_STATE.service.list) {
        IN_MEMORY_STATE.service.list[state.name] = state;
      }
      IN_MEMORY_STATE.service.list[state.name] = state;
    },
    remove(name: string) {
      if (name in IN_MEMORY_STATE.service.list) {
        delete IN_MEMORY_STATE.service.list[name];
        logger.warn(`service '${name}' removed`);
      } else {
        logger.warn(`service '${name}' could not be removed: not found`);
      }
    },
    isRunning(name: string) {
      const state = State.service.get(name);
      return state.state === 'running';
    },
    isPendingAssignment(name: string) {
      const state = State.service.get(name);
      return state.state === 'pending-assignment';
    },

    toPendingAssignment(name: string) {
      const state = State.service.get(name);
      state.state = 'pending-assignment';
      state.assignedRunnerId = null;
    },
    toAssigned(name: string, runnerId: string) {
      const state = State.service.get(name);
      state.state = 'assigned';
      state.assignedRunnerId = runnerId;
    },

    findState(state: ServiceStateEnum) {
      return filter(
        IN_MEMORY_STATE.service.list,
        (service) => service.state === state
      );
    },

    hasPendingAssignments() {
      return some(
        IN_MEMORY_STATE.service.list,
        (state) => state.state === 'pending-assignment'
      );
    },
  },
  runner: {
    get(runnerId: string) {
      return IN_MEMORY_STATE.runner.list[runnerId];
    },
    getRoundRobinNext(type: RunnerType) {
      const roundRobin = IN_MEMORY_STATE.runner.roundRobins[type];
      return roundRobin.ids[roundRobin.cursor];
    },
    moveRoundRobinCursorForward(type: RunnerType) {
      const roundRobin = IN_MEMORY_STATE.runner.roundRobins[type];
      if (!roundRobin.ids.length) {
        roundRobin.cursor = 0;
      } else {
        roundRobin.cursor = (roundRobin.cursor + 1) % roundRobin.ids.length;
      }
    },
    ready({
      id,
      type,
      socket,
    }: {
      id: string;
      type: RunnerType;
      socket: Socket;
    }) {
      const existing = State.runner.get(id);
      if (existing) {
        if (existing.type !== type) {
          throw new Error('EXISTING_RUNNER_TYPE_CONFLICT');
        }
        existing.socket = socket;
        existing.state = 'ready';
        logger.info(`runner '${id}' ready`);
      } else {
        IN_MEMORY_STATE.runner.list[id] = new Runner({
          id,
          type,
          socket,
          state: 'ready',
        });
        logger.info(`runner '${id}' joined`);
      }
    },
    disconnected(runnerId: string) {
      const runner = State.runner.get(runnerId);

      if (runner) {
        runner.state = 'disconnected';
        logger.info(`runner '${runnerId}' disconnected`);
      } else {
        logger.warn(`runner '${runnerId}' disconnected: not found`);
      }
    },
    hasAvailable() {
      return some(IN_MEMORY_STATE.runner.list, (r) => r.state === 'ready');
    },
  },
};
