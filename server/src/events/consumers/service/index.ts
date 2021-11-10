import { isEqual } from 'lodash';
import { Service, Stack } from 'src/data';
import { EVENTS } from 'src/events';
import { ServiceConfig } from 'src/events/types';
import { handler, handlers } from 'src/lib/queue/base';
import { createEventQueue } from 'src/lib/queue/createEvents';

export const serviceQueue = createEventQueue('service', {
  save: handler(
    async (
      {
        name,
        stackName,
        spec,
      }: { name: string; stackName: string; spec: ServiceConfig },
      { logger }
    ) => {
      const serviceName = `${stackName}.${name}`;
      const existing = await Service.getOne(serviceName);

      if (existing) {
        if (!isEqual(existing.spec, spec)) {
          await Service.updateOne(serviceName, {
            spec,
          });
          logger.info(`${serviceName} updated`);
        } else {
          logger.info(`${serviceName} unchanged`);
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
});
