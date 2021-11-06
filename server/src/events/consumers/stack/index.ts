import { forEach } from 'lodash';
import { Entity, ServiceEntity } from 'src/data';
import { EVENTS } from 'src/events';
import { StackConfig } from 'src/events/types';
import { handler } from 'src/lib/queue/base';
import { createEventQueue } from 'src/lib/queue/createEvents';

export const stackQueue = createEventQueue('stack', {
  save: handler(
    (
      { name, spec }: { name: string; spec: StackConfig },
      { dispatcher, logger }
    ) => {
      const existingServices = Entity.matchMeta(
        'stack',
        name
      ) as ServiceEntity[];

      forEach(spec.services, (service, serviceName) => {
        dispatcher.push(
          EVENTS.service.save({
            name: serviceName,
            stackName: name,
            spec: service,
          })
        );
      });
      if (existingServices) {
        existingServices.forEach((service) => {
          if (!spec.services[service.metadata.name]) {
            dispatcher.push(
              EVENTS.service.remove({
                name: service.name,
                stackName: name,
              })
            );
          }
        });
      }

      logger.info(`${name} saved`);
    }
  ),
  remove: handler(({ name }: { name: string }, { dispatcher }) => {
    const stack = Entity.getOne('stack', name);
    if (stack) {
      const spec = stack.spec as StackConfig;
      forEach(spec.services, (service, serviceName) => {
        dispatcher.push(
          EVENTS.service.remove({ name: serviceName, stackName: name })
        );
      });
    }
  }),
});
