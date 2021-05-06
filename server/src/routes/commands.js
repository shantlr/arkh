import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Server } from 'socket.io';

import { Command, CommandTemplate, NAME_REGEX } from '../data';
import { sortBy } from 'lodash';
/**
 *
 * @param {{ io: Server }} input
 * @returns
 */
export const createApiCommandRouter = ({ io }) => {
  const router = Router();

  router.get('/commands', async (req, res) => {
    const commands = await Command.getAll();

    res.status(200).send(sortBy(commands, 'name'));
  });
  router.post('/commands/create', async (req, res) => {
    const { name, template_id, params, path: pwd } = req.body;
    if (!NAME_REGEX.test(name)) {
      return res.status(422).send('Invalid name');
    }
    const template = await CommandTemplate.getById(template_id);
    if (!template) {
      return res.status(422).send('Invalid template');
    }

    try {
      const id = nanoid();
      await Command().insert({
        id,
        name,
        template_id,
        config: JSON.stringify({
          params,
          path: pwd || [],
        }),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      });

      const cmd = await Command.getById(id, { withTemplate: true });
      io.of('runner').emit('update-command', cmd);

      return res.status(200).send(cmd);
    } catch (err) {
      console.error(err);
      return res.status(500).send();
    }
  });

  router.get('/commands/:id', async (req, res) => {
    const { id } = req.params;

    const command = await Command.getById(id, { withTemplate: true });
    if (!command) {
      return res.status(404).send('Not found');
    }

    return res.status(200).send({
      ...command,
      state: 'stopped',
    });
  });

  router.post('/commands/:id/update', async (req, res) => {
    const { id } = req.params;
    const { name, template_id, path: pwd, params } = req.body;

    if (!NAME_REGEX.test(name)) {
      return res.status(422).send('Invalid name');
    }

    const command = await Command.getById(id);
    if (!command) {
      return res.status(422).send('Invalid command');
    }

    const template = await CommandTemplate.getById(template_id);
    if (!template) {
      return res.status(422).send('Invalid template');
    }

    await Command()
      .update({
        name,
        template_id,
        config: JSON.stringify({
          path: pwd,
          params,
        }),
        updated_at: new Date(),
      })
      .where({
        id,
      });

    const cmd = await Command.getById(id, { withTemplate: true });
    io.of('runner').emit('update-command', cmd);

    return res.status(200).send(cmd);
  });

  router.post('/commands/:id/exec', async (req, res) => {
    const { id } = req.params;
    const command = await Command.getById(id);
    if (!command) {
      return res.status(422).send('Invalid command');
    }

    io.of('runner').emit('command-exec', id);

    return res.status(200).send('');
  });
  router.post('/commands/:id/stop', async (req, res) => {
    const { id } = req.params;

    const command = await Command.getById(id);
    if (!command) {
      return res.status(422).send('Invalid command');
    }

    io.of('runner').send('command-stop', id);

    return res.status(200).send('');
  });

  return router;
};
