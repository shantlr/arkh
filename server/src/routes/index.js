import { Router } from 'express';
import { createApiCommandRouter } from './commands';
import { createApiRunnerRouter } from './runners';
import { createApiTemplateRouter } from './templates';

export const createApiRouter = ({ io }) => {
  const router = Router();

  router.use(createApiCommandRouter({ io }));
  router.use(createApiTemplateRouter({ io }));
  router.use(createApiRunnerRouter({ io }));

  return router;
};
