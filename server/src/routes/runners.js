import { Router } from 'express';
import { Server } from 'socket.io';

/**
 *
 * @param {{ io: Server }} input
 * @returns
 */
export const createApiRunnerRouter = ({ io }) => {
  const router = Router();

  router.get('/runners', async (req, res) => {
    console.log('get runners');

    console.log(await io.of('runner').allSockets());
    return res.status(200).send([]);
  });

  return router;
};
