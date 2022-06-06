import { ServiceSpec, ServiceState } from '@shantlr/shipyard-common-types';
import { createEntity, createGroup } from '@shantlr/workflow';
import { isEqual } from 'lodash';

import { baseLogger } from '../config';
import { Service } from '../data';

import { SideEffects } from './sideEffects';
import { runnerRoundRobin, runnersWorkflow } from './runner';
import { stacksWorkflow } from './stack';

type State = ServiceState & {
  get isRunning(): boolean;
};

const createServiceWorkflow = (serviceName: string) => {
  const logger = baseLogger.extend(`service:${serviceName}`);
  const { stackName, serviceKey } = Service.splitFullName(serviceName);

  const state: State = {
    name: serviceName,
    state: 'off',

    assigned_runner_id: null,
    current_task_id: null,
    current_task_state: null,

    get isRunning() {
      return state.state === 'running';
    },
  };

  const serviceEntity = createEntity(state, {
    actions: {
      async save({ spec }: { spec: ServiceSpec }, api) {
        const existing = await api.call(() => Service.getOne(serviceName));

        if (existing) {
          if (!isEqual(existing.spec, spec) || existing.to_delete) {
            await Service.updateOne(serviceName, {
              spec,
            });
            logger.info(`updated`);
            void SideEffects.emit('updateService', {
              serviceName,
            });
          } else {
            logger.info(`unchanged`);
          }
        } else {
          await Service.insertOne({
            name: serviceName,
            spec,
            stack: stackName,
            key: serviceKey,
          });
          logger.info(`created`);
          void SideEffects.emit('addService', {
            serviceName,
          });
        }
      },
      async remove(a: void, api) {
        const service = await Service.getOne(serviceName);
        if (!service) {
          logger.info(`'${serviceName}' not found`);
          return;
        }

        if (state.state === 'assigned' || state.state === 'running') {
          await api.do(serviceEntity.actions.stop, null);
        }

        await Service.removeOne(serviceName);
        logger.info('removed from db');

        const stackName = Service.getStackNameFromName(serviceName);

        stacksWorkflow.get(stackName)?.actions.serviceHasBeenRemoved({
          serviceName,
        });
        void SideEffects.emit('removeService', { serviceName });
      },
      async stop(a: void) {
        if (state.state === 'off') {
          logger.info(`service is already stopped`);
          return;
        }

        if (state.state === 'assigned' || state.state === 'running') {
          if (runnersWorkflow.has(state.assigned_runner_id)) {
            const runner = runnersWorkflow.get(state.assigned_runner_id);
            await runner.actions.stopService(
              { serviceName },
              { promise: true }
            );
          }
        }
        state.state = 'off';
        state.current_task_id = null;
        state.current_task_state = null;
        logger.info('service stopped');
        void SideEffects.emit('updateServiceState', {
          serviceName,
        });
      },
      async run(a: void, api) {
        try {
          const service = await api.call(() => Service.getOne(serviceName));
          if (!service) {
            logger.error(`'${serviceName}' not found`);
            return;
          }
          if (state.isRunning) {
            logger.info('service is already running');
            return;
          }

          state.state = 'pending-assignment';
          state.assigned_runner_id = null;

          void SideEffects.emit('updateServiceState', {
            serviceName,
          });
          servicesWorkflow.bring(serviceName).actions.assignRunner({
            spec: service.spec,
          });

          logger.info('start run');
        } catch (err) {
          console.error(err);
        }
      },
      async assignRunner({ spec }: { spec: ServiceSpec }) {
        if (state.state !== 'pending-assignment') {
          logger.info(`service not in pending assignment: ${state.state}`);
          return null;
        }

        const runnerId = runnerRoundRobin.getNext();
        if (!runnerId) {
          logger.info(`no available runner found`);
          logger.info(`waiting for a runner to join`);
          return;
        }

        logger.info(`assigning to ${runnerId}`);
        state.state = 'assigned';
        state.assigned_runner_id = runnerId;
        void SideEffects.emit('updateServiceState', {
          serviceName,
        });

        await runnersWorkflow
          .get(runnerId)
          .actions.assignService({ serviceName, spec }, { promise: true });
      },
      async retryAssign({ spec }: { spec: ServiceSpec }, api) {
        if (
          state.state === 'pending-assignment' ||
          (state.state === 'assigned' && !state.current_task_id)
        ) {
          state.state = 'pending-assignment';
          state.assigned_runner_id = null;
          state.current_task_id = null;
          state.current_task_state = null;
          await api.do(serviceEntity.actions.assignRunner, { spec });
        }
      },

      taskCreating({ taskId }: { taskId: string }) {
        state.state = 'running';
        state.current_task_id = taskId;
        state.current_task_state = 'creating';
      },
      taskRunning({ taskId }: { taskId: string }) {
        state.current_task_state = 'running';
      },
      taskStopping({ taskId }: { taskId: string }) {
        state.current_task_state = 'stopping';
      },
      taskStopped({ taskId }: { taskId: string }) {
        state.state = 'off';
        state.current_task_state = 'stopped';
      },
      taskExited({ taskId }: { taskId: string }) {
        state.state = 'off';
        state.current_task_state = 'exited';
      },
    },
  });
  return serviceEntity;
};

const logger = baseLogger.extend('services');
export const servicesWorkflow = {
  ...createGroup({
    name: 'services',
    initEntity: createServiceWorkflow,
    leaveEntity: async (entity) => {
      await entity.actions.remove(null, { promise: true });
    },
  }),
  ...createEntity(null, {
    actions: {
      /**
       * Retry assignment for each service in pending-assignment
       */
      async assignPendingAssigments(a: void) {
        if (!runnerRoundRobin.length) {
          logger.info(`no runner available`);
          return;
        }

        const pendingServices = servicesWorkflow
          .keys()
          .map((k) => servicesWorkflow.get(k))
          .filter((service) => {
            return service.state.state === 'pending-assignment';
          });
        const services = await Service.getIn(
          pendingServices.map((s) => s.state.name)
        );
        services.forEach((service) => {
          servicesWorkflow.get(service.name).actions.assignRunner({
            spec: service.spec,
          });
        });
      },
    },
  }),
};
