import { State } from '../../../data/state';
import { EventManager, EVENTS } from '../../../events';
import { ServiceSpec } from '@shantlr/shipyard-common-types';
import { createEventQueue, handler } from '@shantr/metro-queue';

export const runnerQueue = createEventQueue('runner', {
  joined: handler(({ runnerId }: { runnerId: string }, { logger }) => {
    // retry assign runner for service in pending assignments
    if (State.service.hasPendingAssignments()) {
      EventManager.push(EVENTS.service.assignPendingAssignments({}));
    }
  }),
  assignService: handler(
    async (
      {
        serviceName,
        spec,
      }: {
        serviceName: string;
        spec: ServiceSpec;
      },
      { dispatcher, logger }
    ) => {
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
        dispatcher.push(
          EVENTS.service.assignRunner({
            name: serviceName,
            spec,
          })
        );
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
        logger.info(`service '${serviceName}' pushed to '${runner.id}'`);
      } catch (err) {
        console.error(err);
        reassignService();
      }
    }
  ),
});
