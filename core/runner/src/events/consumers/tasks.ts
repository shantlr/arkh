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
  remove: handler(async ({ name }: { name: string }, { logger }) => {
    const existing = State.service.get(name);
    if (!existing) {
      logger.info(`'${name}' not found`);
      return;
    }
    await existing.task.stop();
    State.service.remove(name);
  }),
});
