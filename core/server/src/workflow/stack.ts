import { forEach, isEqual } from 'lodash';
import { StackSpec } from '@shantlr/shipyard-common-types';
import { createEntity, createGroup } from '@shantlr/workflow';

import { Service, Stack } from '../data';
import { baseLogger } from '../config';

import { SideEffects } from './sideEffects';
import { servicesWorkflow } from './service';

const createStackWorkflow = (name: string) => {
  const logger = baseLogger.extend(`stack:${name}`);
  return createEntity(null, {
    actions: {
      async save({ spec, configKey }: { spec: StackSpec; configKey: string }) {
        const existingStack = await Stack.getOne(name);
        if (!existingStack) {
          await Stack.insertOne({
            name,
            config_key: configKey,
            spec,
          });
          logger.info(`'${name}' created`);
          void SideEffects.emit('addStack', { name });
        } else {
          if (
            !existingStack.to_remove &&
            existingStack.config_key !== configKey
          ) {
            logger.error(
              `'${name}' not updated: db config_key is '${existingStack.config_key}' but received '${configKey}'`
            );
            return;
          }

          if (
            existingStack.config_key !== configKey ||
            !isEqual(existingStack.spec, spec) ||
            existingStack.to_remove
          ) {
            await Stack.updateOne(name, {
              config_key: configKey,
              spec,
              to_remove: false,
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
          const serviceName = Service.formatName(name, serviceKey);
          servicesWorkflow.bring(serviceName).actions.save({
            spec: service,
          });
        });
        if (existingServices) {
          existingServices.forEach((service) => {
            if (!spec.services[service.key]) {
              servicesWorkflow.bring(service.name).actions.remove();
            }
          });
        }
      },
      async remove(a: void) {
        const stack = await Stack.getOne(name);
        if (stack) {
          await Stack.updateOne(name, { to_remove: true });

          const spec = stack.spec as StackSpec;
          logger.info(`start removing stack '${name}' services`);
          forEach(spec.services, (service, serviceKey) => {
            const serviceName = Service.formatName(name, serviceKey);
            servicesWorkflow.get(serviceName)?.actions.remove();
          });
        } else {
          logger.info(`'${name}' not found`);
        }
      },
      async serviceHasBeenRemoved({ serviceName }: { serviceName: string }) {
        const stack = await Stack.getOne(name);
        if (!stack) {
          logger.error(`stack '${name}' not found`);
          return;
        }
        if (!stack.to_remove) {
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
      },
      async run(a: void) {
        const stack = await Stack.getOne(name);
        if (!stack) {
          logger.warn(`'${name} not found'`);
          return;
        }
        if (stack.to_remove) {
          logger.warn(`'${name}' is being removed`);
          return;
        }

        forEach(stack.spec.services, (service, serviceKey) => {
          const serviceName = Service.formatName(name, serviceKey);
          servicesWorkflow.bring(serviceName).actions.run();
        });
        logger.info('started');
      },
    },
  });
};

const logger = baseLogger.extend('stacks');
export const stacksWorkflow = createGroup({
  name: 'stacks',
  initEntity: createStackWorkflow,
});
