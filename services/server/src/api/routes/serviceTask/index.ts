import { Router } from 'express';

import { Task, TaskLog } from '../../../data';

export const serviceTaskRouter = () => {
  const router = Router();

  router.get('/:id', async (req, res) => {
    try {
      const { id: taskId } = req.params;
      const task = await Task.get(taskId);
      return res.status(200).send(task);
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  router.get('/:id/logs', async (req, res) => {
    try {
      const { id: taskId } = req.params;
      const logs = await TaskLog.get(taskId);
      return res.status(200).send(logs);
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });

  return router;
};
