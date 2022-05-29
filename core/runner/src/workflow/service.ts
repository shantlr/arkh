import {
  createWorkflowEntity,
  createWorkflowEntityGroup,
} from '@shantlr/workflow';
import { WorkflowCancel } from '@shantlr/workflow/dist/workflowQueue';
import { ServiceSpec } from '@shantlr/shipyard-common-types';
import { isEqual } from 'lodash';
import { Task } from '../lib/task';
import { baseLogger } from '../config';

export const createService = (serviceName: string) => {
  const logger = baseLogger.extend(`service:${serviceName}`);
  logger.info(`creating service '${serviceName}'`);
  const task = new Task({ serviceName, spec: null });

  const state = { task };
  const service = createWorkflowEntity(state, {
    actions: {
      async run(spec: ServiceSpec) {
        try {
          if (isEqual(task.spec, spec)) {
            logger.info(`spec unchanged`);
            // spec unchanged
            if (!task.isRunning()) {
              await task.exec();
              logger.info(`started`);
            }
            return;
          }

          task.updateSpec(spec);
          logger.info(`spec updated`);

          if (task.isRunning()) {
            await task.restart();
            logger.info(`restarted`);
            return;
          }

          await task.exec();
          logger.info(`started`);
        } catch (err) {
          if (err === WorkflowCancel) {
            throw err;
          }
          logger.error(`run failed`, err);
        }
      },
      async stop({ reason }: { reason?: string }) {
        if (!task.isRunning()) {
          logger.warn(`not stopped: is not running`);
          return;
        }
        try {
          await task.stop(reason);
        } catch (err) {
          logger.error(`failed to stop`, err);
        }
      },
    },
  });
  return service;
};
export type ServiceEntity = ReturnType<typeof createService>;

const logger = baseLogger.extend('services');
export const servicesWorkflow = createWorkflowEntityGroup({
  name: 'services',
  initEntity: createService,
  leaveEntity: async (entity, name) => {
    await entity.actions.stop({ reason: 'service removed' }, { promise: true });
    logger.info(`'${name}' removed`);
  },
});
