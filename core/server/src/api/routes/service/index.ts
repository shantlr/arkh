import { Router } from 'express';
import { Service, Task } from 'src/data';
import { State } from 'src/data/state';
import { EventManager, EVENTS } from 'src/events';

export const serviceRouter = () => {
  const router = Router();

  router.get('/list', async (req, res) => {
    try {
      const services = await Service.getAll();
      return res.status(200).send(services);
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  router.get('/:name', async (req, res) => {
    const { name } = req.params;
    try {
      const service = await Service.getOne(name);
      return res.status(200).send(service);
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send(err.message);
    }
  });
  router.post('/:name/run', async (req, res) => {
    try {
      const service = await Service.getOne(req.params.name);
      if (!service) {
        return res.status(404).send();
      }
      EventManager.push(
        EVENTS.service.run({ name: service.key, stackName: service.stack })
      );
      return res.status(200).send({ success: true });
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send(err.message);
    }
  });
  router.post('/:name/stop', async (req, res) => {
    try {
      const { name } = req.params;
      const state = State.service.get(name);
      if (!state) {
        return res.status(200).send({ success: false, message: 'not-running' });
      }

      if (state.assignedRunnerId && state.current_task_state === 'running') {
        const runner = State.runner.get(state.assignedRunnerId);
        if (runner.state === 'ready') {
          await runner.stopService({ name, reason: 'api-endpoint' });
          return res.status(200).send({ success: true });
        } else {
          return res
            .status(200)
            .send({ success: false, message: 'runner-not-ready' });
        }
      }

      return res
        .status(200)
        .send({ success: false, message: 'service-not-running' });
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send(err.message);
    }
  });

  router.get('/:name/tasks', async (req, res) => {
    const { name } = req.params;
    try {
      const service = await Service.getOne(name);
      if (!service) {
        return res.status(404).send();
      }
      const tasks = await Task.list(name);
      return res.status(200).send(tasks);
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send(err.message);
    }
  });

  return router;
};
