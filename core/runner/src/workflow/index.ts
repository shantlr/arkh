import { createWorkflowEntity } from '@shantlr/workflow';
import { ServiceSpec } from '@shantlr/shipyard-common-types';

import { servicesWorkflow } from './service';
import { baseLogger } from '../config';
import { SideEffects } from './sideEffects';

const logger = baseLogger.extend('main-wk');

export const { internalActions, ...runnerMainWorkflow } = createWorkflowEntity(
  null,
  {
    actions: {
      runService({ name, spec }: { name: string; spec: ServiceSpec }) {
        const service = servicesWorkflow.get(name);
        void service.actions.run(spec, { promise: true });
      },
      stopService({ name, reason }: { name: string; reason?: string }) {
        if (!servicesWorkflow.has(name)) {
          logger.warn(`service '${name}' could not be stopped: not found`);
          void SideEffects.emit('unknownService', { name });
          return;
        }
        const service = servicesWorkflow.get(name);
        service.actions.stop({ reason });
      },
      removeService({ name }: { name: string }) {
        if (!servicesWorkflow.has(name)) {
          logger.warn(`service '${name}' could not be removed: not found`);
          return;
        }
        void servicesWorkflow.leave(name);
      },
    },
  }
);
