import { Router } from 'express';
import { mapValues } from 'lodash';
import { Service, Stack, StackTab } from 'src/data';
import { State } from 'src/data/state';
import { EventManager, EVENTS } from 'src/events';

export const stackRouter = () => {
  const router = Router();

  router.get('/list', async (req, res) => {
    try {
      const stacks = await Stack.getAll();
      return res.status(200).send(stacks);
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  router.get('/:name', async (req, res) => {
    try {
      const stack = await Stack.getOne(req.params.name);
      if (stack) {
        return res.status(200).send(stack);
      } else {
        return res.status(404).send();
      }
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  router.get('/:name/services/state', async (req, res) => {
    try {
      const stack = await Stack.getOne(req.params.name);
      if (stack) {
        const serviceStates = mapValues(stack.spec.services, (service, key) => {
          return State.service.get(`${stack.name}.${key}`);
        });
        return res.status(200).send(serviceStates);
      } else {
        return res.status(404).send();
      }
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });

  router.post('/:name/run', async (req, res) => {
    try {
      const stack = await Stack.getOne(req.params.name);
      if (!stack) {
        return res.status(404).send();
      }
      EventManager.push(
        EVENTS.stack.run({
          name: stack.name,
        })
      );
      return res.status(200).send({ success: true });
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });

  router.get('/:name/tabs', async (req, res) => {
    try {
      const { name } = req.params;
      const stack = await Stack.getOne(name);
      if (!stack) {
        return res.status(404).send();
      }

      const existing = await StackTab.get(name);
      if (existing && existing.tabs) {
        return res.status(200).send(existing.tabs);
      }

      const keys: Record<string, true> = {};
      Object.keys(stack.spec.services).forEach((serviceKey) => {
        keys[Service.formatName(name, serviceKey)] = true;
      });
      return res.status(200).send([
        {
          name: 'All',
          slug: 'all',
          keys,
        },
      ]);
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  router.post('/:name/tabs/update', async (req, res) => {
    try {
      const { name } = req.params;
      const { tab } = req.body;
      if (!tab) {
        return res.status(400).send('tab-not-provided');
      }
      const existing = await StackTab.get(name);
      if (!existing) {
        await StackTab.upsert(name, [
          {
            name: tab.name,
            slug: StackTab.formatSlug(tab.name),
            keys: tab.keys,
            rows: tab.rows,
          },
        ]);
      } else {
        const tabs = [...existing.tabs];
        const idx = tabs.findIndex((t) => t.name === tab.name);
        const update = {
          name: tab.name,
          slug: StackTab.formatSlug(tab.name),
          keys: tab.keys,
          rows: tab.rows,
        };
        if (idx === -1) {
          tabs.push(update);
        } else {
          tabs[idx] = update;
        }
        await StackTab.upsert(name, tabs);
      }

      return res.status(200).send({ success: true });
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  router.post('/:name/tabs/rename', async (req, res) => {
    try {
      const { name } = req.params;
      const { oldName, newName } = req.body;
      const existing = await StackTab.get(name);
      if (!existing) {
        return res.status(404).send();
      }

      await StackTab.upsert(
        name,
        existing.tabs.map((tab) => {
          if (tab.name === oldName) {
            return {
              ...tab,
              name: newName,
              slug: StackTab.formatSlug(newName),
            };
          }
          return tab;
        })
      );

      return res.status(200).send({ success: true });
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  // router.post('/:name/tabs/update-order', async (req, res) => {
  //   try {
  //     const { name } = req.params;
  //     const { tabSlugs } = req.body;
  //     if (!tabSlugs) {
  //       return res.status(400).send('tab-slugs-not-provided');
  //     }

  //     // await StackTab.upsert(name, tab);
  //     return res.status(200).send({ success: true });
  //   } catch (err) {
  //     req.logger.error(err);
  //     return res.status(500).send();
  //   }
  // });

  return router;
};
