import { forEach, isEqual } from 'lodash';
import { Service, Stack } from 'src/data';
import { EVENTS } from 'src/events';
import { StackSpec } from '@shantr/metro-common-types';
import { handler, createEventQueue } from '@shantr/metro-queue';
import { SideEffects } from 'src/events/sideEffects';

export const stackQueue = createEventQueue('stack', {
  save: handler(
    async (
      { name, spec }: { name: string; spec: StackSpec },
      { dispatcher, logger }
    ) => {
      const existingStack = await Stack.getOne(name);
      if (!existingStack) {
        await Stack.insertOne({
          name,
          spec,
        });
        logger.info(`'${name}' created`);
        void SideEffects.emit('addStack', { name });
      } else {
        if (!isEqual(existingStack.spec, spec) || existingStack.to_remove) {
          await Stack.updateOne(name, {
            spec,
          });
          logger.info(`'${name}' updated`);
          void SideEffects.emit('updateStack', { name });
        } else {
          logger.info(`'${name}' unchanged`);
        }
      }
      const existingServices = await Service.find({
        stack: name,
      });

      forEach(spec.services, (service, serviceKey) => {
        dispatcher.push(
          EVENTS.service.save({
            key: serviceKey,
            stackName: name,
            spec: service,
          })
        );
      });
      if (existingServices) {
        existingServices.forEach((service) => {
          if (!spec.services[service.key]) {
            dispatcher.push(
              EVENTS.service.remove({
                name: service.name,
              })
            );
          }
        });
      }
    }
  ),
  remove: handler(
    async ({ name }: { name: string }, { dispatcher, logger }) => {
      const stack = await Stack.getOne(name);
      if (stack) {
        await Stack.updateOne(name, { to_remove: true });

        const spec = stack.spec as StackSpec;
        logger.info(`start removing stack '${name}' services`);
        forEach(spec.services, (service, serviceKey) => {
          dispatcher.push(
            EVENTS.service.remove({
              name: Service.formatName(name, serviceKey),
            })
          );
        });
      } else {
        logger.info(`'${name}' not found`);
      }
    }
  ),
  removeIfAllServiceRemoved: handler(
    async ({ name }: { name: string }, { logger }) => {
      const stack = await Stack.getOne(name);
      if (!stack) {
        logger.error(`stack '${name}' not found`);
        return;
      }

      if (!stack.to_remove) {
        logger.info(`'${name}' is not expected to be removed (ignored)`);
        return;
      }
      const services = await Service.find({
        stack: name,
      });
      if (!services.length) {
        await Stack.removeOne(name);
        logger.info(`'${name}' removed`);
        void SideEffects.emit('removeStack', { name });
      }
    }
  ),

  run: handler(async ({ name }: { name: string }, { logger, dispatcher }) => {
    const stack = await Stack.getOne(name);
    if (!stack) {
      logger.warn(`'${name} not found'`);
      return;
    }
    if (stack.to_remove) {
      logger.warn(`'${name}' is being removed`);
      return;
    }

    forEach(stack.spec.services, (service, serviceName) => {
      dispatcher.push(
        EVENTS.service.run({
          name: serviceName,
          stackName: name,
        })
      );
    });
  }),
});
