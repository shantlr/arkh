import { ServiceSpec } from '@shantlr/shipyard-common-types';
import {
  createWorkflowEntity,
  createWorkflowEntityGroup,
} from '@shantlr/workflow';
import { baseLogger } from '../config';
import { State } from '../data/state';
import { servicesWorkflow } from './service';

const createRunnerWorkflow = (runnerId: string) => {
  const logger = baseLogger.extend(`runner:${runnerId}`);
  return createWorkflowEntity(null, {
    actions: {
      joined(a: void) {
        // retry assign runner for service in pending assignments
        if (State.service.hasPendingAssignments()) {
          servicesWorkflow.actions.assignPendingAssigments();
        }
      },
      async assignService({
        serviceName,
        spec,
      }: {
        serviceName: string;
        spec: ServiceSpec;
      }) {
        const state = State.service.get(serviceName);
        if (!state) {
          logger.warn(`service '${serviceName}' state not found`);
          return;
        }

        if (state.state !== 'assigned') {
          logger.warn(`service '${serviceName}' not in assigned state`);
          return;
        }

        const reassignService = () => {
          State.service.toPendingAssignment(serviceName);
          servicesWorkflow.get(serviceName).actions.assignRunner({
            spec,
          });
        };

        if (!state.assignedRunnerId) {
          logger.warn(`service '${serviceName}' has no assigned runner`);
          reassignService();
          return;
        }

        const runner = State.runner.get(state.assignedRunnerId);
        if (!runner) {
          logger.warn(`runner '${state.assignedRunnerId}' not found`);
          reassignService();
          return;
        }
        if (runner.state !== 'ready') {
          logger.warn(`runner '${state.assignedRunnerId}' not ready`);
          reassignService();
          return;
        }

        try {
          await runner.assignService({
            name: serviceName,
            spec,
          });
          logger.info(`service '${serviceName}' assigned to '${runner.id}'`);
        } catch (err) {
          console.error(err);
          reassignService();
        }
      },
    },
  });
};

const logger = baseLogger.extend('runners');
export const runnersWorkflow = createWorkflowEntityGroup({
  name: 'runnners',
  initEntity: createRunnerWorkflow,
});
