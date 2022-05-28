import { createWorkflowEntity } from '@shantlr/workflow';
import { ServiceSpec } from '@shantr/metro-common-types';
import { createLogger } from '@shantr/metro-logger';

import { Services } from './service';

const logger = createLogger('main');

export const { internalActions, ...runnerMainWorkflow } = createWorkflowEntity(
  null,
  {
    actions: {
      runService({ name, spec }: { name: string; spec: ServiceSpec }) {
        const service = Services.get(name);
        void service.actions.run(spec, { promise: true });
      },
      stopService({ name, reason }: { name: string; reason?: string }) {
        if (!Services.has[name]) {
          logger.warn(`service '${name}' could not be stopped: not found`);
          return;
        }
        const service = Services.get(name);
        service.actions.stop({ reason });
      },
      removeService({ name }: { name: string }) {
        if (!Services.has(name)) {
          logger.warn(`service '${name}' could not be removed: not found`);
          return;
        }
        Services.leave(name);
      },
    },
  }
);
