import { Router } from 'express';

import { Service, Task } from '../../../data';
import { servicesWorkflow } from '../../../workflow';

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
      if (servicesWorkflow.has(name)) {
        // @ts-ignore
        service.state = servicesWorkflow.get(name).state;
      }
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
      servicesWorkflow.get(service.name).actions.run();
      return res.status(200).send({ success: true });
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send(err.message);
    }
  });
  router.post('/:name/stop', async (req, res) => {
    try {
      const { name } = req.params;
      if (!servicesWorkflow.has(name)) {
        await Task.update.stopRelicas(name, req.logger);
        return res.status(200).send({ success: false, message: 'not-running' });
      }

      const service = servicesWorkflow.get(name);
      if (!service.state.isRunning) {
        await Task.update.stopRelicas(name, req.logger);
      }
      void service.actions.stop(null);
      return res.status(200).send({ success: true });
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
