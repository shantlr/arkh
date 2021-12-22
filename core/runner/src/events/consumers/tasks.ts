import { ServiceSpec } from '@shantr/metro-common-types';
import { createEventQueue, handler } from '@shantr/metro-queue';
import { isEqual } from 'lodash';

import { State } from 'src/data';
import { Task } from 'src/lib/task';

export const tasks = createEventQueue('tasks', {
  run: handler(
    async ({ name, spec }: { name: string; spec: ServiceSpec }, { logger }) => {
      const existing = State.service.get(name);
      if (existing) {
        if (isEqual(existing.task.spec, spec)) {
          // spec unchanged
          if (!existing.task.isRunning()) {
            await existing.task.exec();
            logger.info(`'${name}' started`);
          }

          logger.info(`'${name}' spec unchanged`);
          return;
        }

        existing.task.updateSpec(spec);
        logger.info(`'${name}' spec updated`);

        if (existing.task.isRunning()) {
          await existing.task.restart();
          logger.info(`'${name}' restarted`);
        } else {
          await existing.task.exec();
          logger.info(`'${name}' started`);
        }
      } else {
        State.service.add({
          name,
          task: new Task({ serviceName: name, spec }),
        });
        const service = State.service.get(name);
        await service.task.exec();
        logger.info(`'${name}' started`);
      }
    }
  ),
  stop: handler(
    async ({ name, reason }: { name: string; reason?: string }, { logger }) => {
      const existing = State.service.get(name);
      if (!existing) {
        logger.warn(`'${name}' could not be stopped: not found`);
        return;
      }
      if (!existing.task.isRunning()) {
        logger.warn(`'${name}' could not be stopped: not running`);
        return;
      }
      try {
        await existing.task.stop(reason);
      } catch (err) {
        logger.error(err);
        logger.error(`'${name}' failed to stop`);
      }
    }
  ),
  remove: handler(async ({ name }: { name: string }, { logger }) => {
    const existing = State.service.get(name);
    if (!existing) {
      logger.info(`'${name}' could not be removed: not found`);
      return;
    }
    await existing.task.stop();
    State.service.remove(name);
  }),
});
