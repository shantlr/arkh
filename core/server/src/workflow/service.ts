import { ServiceSpec } from '@shantlr/shipyard-common-types';
import {
  createWorkflowEntity,
  createWorkflowEntityGroup,
} from '@shantlr/workflow';
import { isEqual, keyBy } from 'lodash';
import { baseLogger } from '../config';
import { Service, Stack } from '../data';
import { State } from '../data/state';
import { SideEffects } from '../events/sideEffects';
import { runnersWorkflow } from './runner';
import { stacksWorkflow } from './stack';

const createServiceWorkflow = (serviceName: string) => {
  const logger = baseLogger.extend(`service:${serviceName}`);
  const { stackName, serviceKey } = Service.splitFullName(serviceName);
  return createWorkflowEntity(
    { name: serviceName },
    {
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

          if (!State.service.get(serviceName)) {
            State.service.init({
              name: serviceName,
              state: 'off',
            });
          }
        },
        async remove(a: void) {
          const service = await Service.getOne(serviceName);
          if (!service) {
            logger.info(`'${serviceName}' not found`);
            return;
          }
          const state = State.service.get(serviceName);
          if (state) {
            if (state.state === 'assigned' || state.state === 'running') {
              await State.service.stopTask(serviceName, 'service-removed');
            }
          }

          await Service.removeOne(serviceName);
          State.service.remove(serviceName);
          logger.info(`'${serviceName}' removed`);

          const stackName = Service.getStackNameFromName(serviceName);
          const stack = await Stack.getOne(stackName);
          if (stack && stack.to_remove) {
            stacksWorkflow.get(stack.name).actions.removeIfAllServiceRemoved();
          }
          logger.info('removed');

          void SideEffects.emit('removeService', { serviceName });
        },
        async run(a: void) {
          try {
            const service = await Service.getOne(serviceName);
            if (!service) {
              logger.error(`'${serviceName}' not found`);
              return;
            }
            if (State.service.isRunning(serviceName)) {
              logger.info(`'${serviceName}' is already running`);
              return;
            }
            State.service.toPendingAssignment(serviceName);
            servicesWorkflow.get(serviceName).actions.assignRunner({
              spec: service.spec,
            });
            logger.info('start run');
          } catch (err) {
            console.error(err);
          }
        },
        async stop() {
          //
        },
        async assignRunner({ spec }: { spec: ServiceSpec }) {
          const state = State.service.get(serviceName);
          if (state.state !== 'pending-assignment') {
            logger.info(`service not in pending assignment: ${state.state}`);
            return null;
          }

          const runnerId = State.runner.getRoundRobinNext('run-process');
          if (!runnerId) {
            logger.info(`no available runner found`);
            logger.info(`waiting for a runner to join`);
            return;
          }

          logger.info(`assigning to ${runnerId}`);
          State.service.toAssigned(serviceName, runnerId);
          runnersWorkflow
            .get(runnerId)
            .actions.assignService({ serviceName, spec });
          logger.info(`assigned to ${runnerId}`);
          State.runner.moveRoundRobinCursorForward('run-process');
        },
      },
    }
  );
};

const logger = baseLogger.extend('services');
export const servicesWorkflow = createWorkflowEntityGroup({
  name: 'services',
  initEntity: createServiceWorkflow,
  leaveEntity: async (entity) => {
    await entity.actions.remove(null, { promise: true });
  },

  actions: {
    /**
     * Retry assignment for each service in pending-assignment
     */
    async assignPendingAssigments(a: void) {
      const pendingServices = State.service.findState('pending-assignment');
      if (!pendingServices.length) {
        return;
      }
      if (!State.runner.hasAvailable()) {
        logger.info(`no runner available`);
        return;
      }

      const services = await Service.getIn(
        pendingServices.map((s) => s.name)
      ).then((r) => keyBy(r, 'name'));

      pendingServices.forEach((s) => {
        const service = services[s.name];
        if (!service) {
          logger.error(`service '${s.name}' not found`);
        } else {
          servicesWorkflow.get(s.name).actions.assignRunner({
            spec: service.spec,
          });
        }
      });
    },
  },
});
