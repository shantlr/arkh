import { Router } from 'express';
import { mapValues } from 'lodash';
import { Stack } from 'src/data';
import { State } from 'src/data/state';
import { EventManager, EVENTS } from 'src/events';

export const stackRouter = () => {
  const router = Router();

  router.get('/list', async (req, res) => {
    try {
      const stacks = await Stack.getAll();
      return res.status(200).send(stacks);
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  router.get('/:name', async (req, res) => {
    try {
      const stack = await Stack.getOne(req.params.name);
      if (stack) {
        return res.status(200).send(stack);
      } else {
        return res.status(404).send();
      }
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  router.get('/:name/services/state', async (req, res) => {
    try {
      const stack = await Stack.getOne(req.params.name);
      if (stack) {
        const serviceStates = mapValues(stack.spec.services, (service, key) => {
          return State.service.get(`${stack.name}.${key}`);
        });
        return res.status(200).send(serviceStates);
      } else {
        return res.status(404).send();
      }
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });

  router.post('/:name/run', async (req, res) => {
    try {
      const stack = await Stack.getOne(req.params.name);
      if (!stack) {
        return res.status(404).send();
      }
      EventManager.push(
        EVENTS.stack.run({
          name: stack.name,
        })
      );
      return res.status(200).send({ success: true });
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });

  return router;
};
