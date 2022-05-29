import { Logger } from '@shantlr/shipyard-logger';
import { Router } from 'express';
import { Service, Task } from '../../../data';
import { State } from '../../../data/state';
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
  const stopRelicasTasks = async (serviceName: string, logger: Logger) => {
    // check if any reliacas of not stopped task
    const tasks = await Task.list(serviceName);
    let someStopped = false;
    await Promise.all(
      tasks.map(async (t) => {
        if (!t.exited_at) {
          logger.info(`stop relicas tasks '${t.id}'`);
          await Task.update.syncStopped(t.id);
          someStopped = true;
        }
      })
    );
    return someStopped;
  };
  router.post('/:name/stop', async (req, res) => {
    try {
      const { name } = req.params;
      const state = State.service.get(name);
      if (!state) {
        await stopRelicasTasks(name, req.logger);
        return res.status(200).send({ success: false, message: 'not-running' });
      }

      if (state.assignedRunnerId && state.state === 'running') {
        const result = await State.service.stopTask(name, 'api-endpoint');
        return res.status(200).send(result);
      }

      if (await stopRelicasTasks(name, req.logger)) {
        return res.status(200).send({ success: true, message: 'stopped' });
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
