import { Router } from 'express';
import { Service } from 'src/data';
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
      return res.status(500).send();
    }
  });

  return router;
};
