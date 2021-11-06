import { isEqual } from 'lodash';
import { Entity } from 'src/data';
import { ServiceConfig } from 'src/events/types';
import { handler } from 'src/lib/queue/base';
import { createEventQueue } from 'src/lib/queue/createEvents';

export const serviceQueue = createEventQueue('service', {
  save: handler(
    (
      {
        name,
        stackName,
        spec,
      }: { name: string; stackName: string; spec: ServiceConfig },
      { logger }
    ) => {
      const existing = Entity.getOne('service', name);
      const serviceName = `${stackName}.${name}`;
      if (existing) {
        if (!isEqual(existing.spec, spec)) {
          Entity.updateOne('service', serviceName, {
            spec,
          });
          logger.info(`${serviceName} updated`);
        } else {
          logger.info(`${serviceName} unchanged`);
        }
      } else {
        Entity.insertOne({
          type: 'service',
          name: serviceName,
          spec,
          metadata: {},
        });
        logger.info(`${serviceName} created`);
      }
    }
  ),
  remove: handler(
    ({ name, stackName }: { name: string; stackName: string }, { logger }) => {
      const key = `${stackName}.${name}`;
      const removed = Entity.removeOne('service', key);
      if (removed) {
        logger.info(`'${key}' removed`);
      } else {
        logger.info(`'${key}' not found`);
      }
    }
  ),
});
