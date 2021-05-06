import { Router } from 'express';
import { sortBy } from 'lodash';
import { nanoid } from 'nanoid';

import { CommandTemplate, NAME_REGEX } from '../data';

export const createApiTemplateRouter = () => {
  const router = Router();

  router.get('/directory', async (req, res) => {
    const { path: pwd } = req.query;
    const p = path.resolve(config.get('directory'), pwd || '');

    const files = await fs.promises.readdir(p, {
      withFileTypes: true,
    });
    const directories = files.filter(
      (d) => d.isDirectory() && !d.name.startsWith('.')
    );

    return res.status(200).send({
      path: p,
      directories: directories.map((d) => d.name),
    });
  });

  router.get('/templates', async (req, res) => {
    const templates = await CommandTemplate.getAll();

    return res.status(200).send(sortBy(templates, 'name'));
  });

  router.post('/templates/create', async (req, res) => {
    const { name, bin, args } = req.body;

    if (!NAME_REGEX.test(name)) {
      return res.status(422).send('Invalid name');
    }

    const existing = await CommandTemplate.getByName(name);
    if (existing) {
      return res.status(422).send('Name already used');
    }

    await CommandTemplate().insert({
      id: nanoid(),
      name,
      config: JSON.stringify({
        bin,
        args,
      }),
      created_at: new Date(),
      updated_at: new Date(),
    });
    return res.status(200).send('OK');
  });

  router.post('/templates/:id/update', async (req, res) => {
    const { id } = req.params;
    const { name, bin, args } = req.body;

    if (!NAME_REGEX.test(name)) {
      return res.status(422).send('Invalid name');
    }

    const template = await CommandTemplate.getById(id);
    if (!template) {
      return res.status(422).send('Invalid template');
    }

    try {
      await CommandTemplate()
        .update({
          name,
          config: JSON.stringify({
            bin,
            args,
          }),
          updated_at: new Date(),
        })
        .where({
          id,
        });
      return res.status(200).send();
    } catch (err) {
      console.error(err);
      return res.status(500).send('');
    }
  });

  return router;
};
