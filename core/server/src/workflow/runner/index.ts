import { ServiceSpec } from '@shantlr/shipyard-common-types';
import { createEntity, createGroup } from '@shantlr/workflow';
import { Socket } from 'socket.io';

import { baseLogger } from '../../config';
import { Runner, RunnerType } from '../../runnerWs/class';
import { servicesWorkflow } from '../service';

import { createRoundRobin } from './roundRobin';

export const runnerRoundRobin = createRoundRobin();

type State = {
  runner: Runner;
  services: Record<
    string,
    {
      state: 'assigning' | 'assigned';
    }
  >;
};

const createRunnerWorkflow = (runnerId: string) => {
  const logger = baseLogger.extend(`runner:${runnerId}`);
  const state: State = {
    runner: new Runner({
      id: runnerId,
      type: null,
      socket: null,
      state: 'not-inited',
    }),
    services: {},
  };
  return createEntity(state, {
    actions: {
      ready({ type, socket }: { type: RunnerType; socket: Socket }) {
        if (
          state.runner.state === 'ready' &&
          state.runner.socket.id !== socket.id
        ) {
          logger.warn(`runner already connected`);
          socket.emit('force-runner-exit', {
            reason: 'already-connected',
          });
          return;
        }

        state.runner.type = type;
        state.runner.socket = socket;
        state.runner.state = 'ready';

        runnerRoundRobin.add(runnerId);

        // retry assign runner for service in pending assignments
        // if (State.service.hasPendingAssignments()) {
        servicesWorkflow.actions.assignPendingAssigments();
        // }
      },
      unavailable() {
        runnerRoundRobin.remove(runnerId);
      },
      async assignService({
        serviceName,
        spec,
      }: {
        serviceName: string;
        spec: ServiceSpec;
      }) {
        const reassignService = async () => {
          const service = servicesWorkflow.get(serviceName);
          service.actions.retryAssign({ spec });
        };

        if (state.runner.state !== 'ready') {
          logger.warn(`runner is not ready`);
          await reassignService();
          return;
        }

        try {
          await state.runner.assignService({
            name: serviceName,
            spec,
          });
          logger.info(`service '${serviceName}' assigned`);
        } catch (err) {
          logger.error(`failed to assign service '${serviceName}' %o`, err);
          await reassignService();
        }
      },
      async stopService({
        serviceName,
        reason,
      }: {
        serviceName: string;
        reason?: string;
      }) {
        if (state.runner.state !== 'ready') {
          await state.runner.stopService({ name: serviceName, reason });
        } else {
          logger.warn(
            `could not stop service '${serviceName}': runner not ready`
          );
        }
      },
    },
  });
};

const logger = baseLogger.extend('runners');
export const runnersWorkflow = createGroup({
  name: 'runnners',
  initEntity: createRunnerWorkflow,
  async leaveEntity(entity) {
    await entity.actions.unavailable(null, { promise: true });
  },
});
