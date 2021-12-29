import { filter, some } from 'lodash';
import { Socket } from 'socket.io';
import { ServiceState, ServiceStateEnum } from '@shantr/metro-common-types';
import { createLogger } from '@shantr/metro-logger';
import { Runner, RunnerType } from 'src/runnerWs/class';
import { SideEffects } from 'src/events/sideEffects';

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
      logger.info(`service '${state.name}' state inited`);
    },
    remove(name: string) {
      if (name in IN_MEMORY_STATE.service.list) {
        delete IN_MEMORY_STATE.service.list[name];
        logger.warn(`service '${name}' removed`);
      } else {
        logger.warn(`service '${name}' could not be removed: not found`);
      }
    },
    async stopTask(name: string, reason?: string) {
      const state = State.service.get(name);
      if (state && (state.state === 'running' || state.state === 'assigned')) {
        const runner = State.runner.get(state.assignedRunnerId);
        if (runner.state === 'ready') {
          await runner.stopService({ name, reason });
          return { success: true, message: '' };
        }
        return { success: false, message: 'runner-not-ready' };
      }

      logger.warn(`service '${name}' is not running`);
      return { success: false, message: 'service-not-running' };
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
      void SideEffects.emit('updateServiceState', {
        serviceName: name,
      });
    },
    cancelPendingAssignment(name: string) {
      const state = State.service.get(name);
      state.state = 'off';
      state.assignedRunnerId = null;
      void SideEffects.emit('updateServiceState', {
        serviceName: name,
      });
    },
    toAssigned(name: string, runnerId: string) {
      const state = State.service.get(name);
      state.state = 'assigned';
      state.assignedRunnerId = runnerId;
      void SideEffects.emit('updateServiceState', {
        serviceName: name,
      });
    },

    toTaskCreating(taskId: string, name: string) {
      const state = State.service.get(name);
      state.state = 'running';
      state.current_task_id = taskId;
      state.current_task_state = 'creating';
      logger.info(`'${name}' task creating`);
      void SideEffects.emit('updateServiceState', {
        serviceName: name,
      });
    },
    toTaskRunning(taskId: string, name: string) {
      const state = State.service.get(name);
      state.state = 'running';
      state.current_task_id = taskId;
      state.current_task_state = 'running';
      logger.info(`'${name}' task running`);
      void SideEffects.emit('updateServiceState', {
        serviceName: name,
      });
    },
    toTaskStopping(taskId: string, name: string) {
      const state = State.service.get(name);
      state.state = 'running';
      state.current_task_id = taskId;
      state.current_task_state = 'stopping';
      logger.info(`'${name}' task stopping`);
      void SideEffects.emit('updateServiceState', {
        serviceName: name,
      });
    },
    toTaskStopped(taskId: string, name: string) {
      const state = State.service.get(name);
      state.state = 'off';
      state.current_task_id = taskId;
      state.current_task_state = 'stopped';
      logger.info(`'${name}' task stopped`);
      void SideEffects.emit('updateServiceState', {
        serviceName: name,
      });
    },
    toTaskExited(taskId: string, name: string) {
      const state = State.service.get(name);
      state.state = 'off';
      state.current_task_id = taskId;
      state.current_task_state = 'exited';
      logger.info(`'${name}' task exited`);
      state.assignedRunnerId = null;
      void SideEffects.emit('updateServiceState', {
        serviceName: name,
      });
    },

    /**
     * Get all services with given state
     */
    findState(state: ServiceStateEnum) {
      return filter(
        IN_MEMORY_STATE.service.list,
        (service) => service.state === state
      );
    },

    /**
     * Has some service that is waiting for assignment
     */
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

      if (!IN_MEMORY_STATE.runner.roundRobins[type].ids.includes(id)) {
        IN_MEMORY_STATE.runner.roundRobins[type].ids.push(id);
      }
    },
    leave(runnerId: string) {
      const runner = State.runner.get(runnerId);
      if (runner) {
        runner.state = 'leaving';
        logger.info(`runner '${runnerId}' is leaving`);
      } else {
        logger.warn(`runner '${runnerId}' could not leave: not found`);
      }
    },
    disconnected(runnerId: string) {
      const runner = State.runner.get(runnerId);

      if (runner) {
        if (runner.state === 'leaving') {
          runner.state = 'gracefully-disconnected';
        } else {
          runner.state = 'ungracefully-disconnected';
        }
        // remove from round robins list
        const idx = IN_MEMORY_STATE.runner.roundRobins[runner.type].ids.indexOf(
          runner.id
        );
        if (idx !== -1) {
          IN_MEMORY_STATE.runner.roundRobins[runner.type].ids.splice(idx, 1);
        }
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
