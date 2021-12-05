import { isEqual, keyBy } from 'lodash';
import { ServiceSpec } from '@shantr/metro-common-types';
import { handler, handlers, createEventQueue } from '@shantr/metro-queue';

import { Service, Stack } from 'src/data';
import { State } from 'src/data/state';
import { EVENTS } from 'src/events';

export const serviceQueue = createEventQueue('service', {
  save: handler(
    async (
      {
        name,
        stackName,
        spec,
      }: { name: string; stackName: string; spec: ServiceSpec },
      { logger }
    ) => {
      const serviceName = `${stackName}.${name}`;
      const existing = await Service.getOne(serviceName);

      if (existing) {
        if (!isEqual(existing.spec, spec)) {
          await Service.updateOne(serviceName, {
            spec,
          });
          logger.info(`'${serviceName}' updated`);
        } else {
          logger.info(`'${serviceName}' unchanged`);
        }
      } else {
        await Service.insertOne({
          name: serviceName,
          spec,
          stack: stackName,
          key: name,
        });
        logger.info(`${serviceName} created`);
      }

      if (!State.service.get(serviceName)) {
        State.service.init({
          name: serviceName,
          state: 'off',
        });
      }
    }
  ),
  remove: handler(
    async (
      { name, stackName }: { name: string; stackName: string },
      { dispatcher, logger }
    ) => {
      const key = `${stackName}.${name}`;
      const removed = await Service.removeOne(key);
      if (removed) {
        logger.info(`'${key}' removed`);
        dispatcher.push(
          EVENTS.service.removed({
            name,
            stackName,
          })
        );
      } else {
        logger.info(`'${key}' not found`);
      }
    }
  ),
  removed: handlers<{ name: string; stackName: string }>({
    async removeStack({ stackName }, { dispatcher }) {
      const stack = await Stack.getOne(stackName);
      if (stack && stack.to_remove) {
        dispatcher.push(
          EVENTS.stack.removeIfAllServiceRemoved({
            name: stackName,
          })
        );
      }
    },
  }),
  run: handler(
    async (
      { name, stackName }: { name: string; stackName: string },
      { dispatcher, logger }
    ) => {
      const serviceName = `${stackName}.${name}`;
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
      dispatcher.push(
        EVENTS.service.assignRunner({
          name: serviceName,
          spec: service.spec,
        })
      );
    }
  ),
  assignPendingAssignments: handler(
    async (arg: Record<string, never>, { dispatcher, logger }) => {
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
          dispatcher.push(
            EVENTS.service.assignRunner({
              name: service.name,
              spec: service.spec,
            })
          );
        }
      });
    }
  ),
  assignRunner: handler(
    (
      { name, spec }: { name: string; spec: ServiceSpec },
      { dispatcher, logger }
    ) => {
      const state = State.service.get(name);
      if (state.state !== 'pending-assignment') {
        logger.info(`service not in pending assignment: ${state.state}`);
        return null;
      }

      const runnerId = State.runner.getRoundRobinNext('run-process');
      if (!runnerId) {
        logger.info(`no available runner found`);
        logger.info(`service '${name}' will be waiting for runner to join`);
        return;
      }

      State.service.toAssigned(name, runnerId);
      dispatcher.push(
        EVENTS.runner.assignService({
          serviceName: name,
          spec,
        })
      );
      logger.info(`'${name}' assigned to ${runnerId}`);
      State.runner.moveRoundRobinCursorForward('run-process');
    }
  ),
});