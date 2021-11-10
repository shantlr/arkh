import { Router } from 'express';

export const stackRouter = () => {
  const router = Router();

  router.get('/list', (req, res) => {
    // const stacks = Entity.getAll();
    //
  });

  return router;
};
