import { Router } from 'express';
import { Stack } from 'src/data';
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

  router.get('/:name/run', async (req, res) => {
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
