import { ServiceState } from '@shantlr/shipyard-common-types';
import { Router } from 'express';
import { mapValues } from 'lodash';

import { Service, Stack, StackTab } from '../../../data';
import { servicesWorkflow, stacksWorkflow } from '../../../workflow';

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
        const serviceStates: Record<string, ServiceState> = mapValues(
          stack.spec.services,
          (service, key): ServiceState => {
            const serviceName = Service.formatName(stack.name, key);
            if (servicesWorkflow.has(serviceName)) {
              return servicesWorkflow.get(serviceName).state;
            }
            return {
              name: serviceName,
              state: 'off',
            };
          }
        );
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
      stacksWorkflow.get(stack.name).actions.run();
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
  /**
   * Update one tab
   */
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
  /**
   * Add tab
   */
  router.post('/:name/tabs/create', async (req, res) => {
    try {
      const { name } = req.params;
      const { tabName } = req.body;
      if (!tabName) {
        return res.status(400).send('tab-name-not-provided');
      }
      const existing = await StackTab.get(name);
      if (!existing) {
        await StackTab.upsert(name, [
          {
            name: tabName,
            slug: StackTab.formatSlug(tabName),
            keys: {},
            rows: null,
          },
        ]);
      } else {
        const tabs = [...existing.tabs];
        const idx = tabs.findIndex((t) => t.name === tabName);
        if (idx !== -1) {
          return res.status(400).send(`tab-name-already-used`);
        }
        tabs.push({
          name: tabName,
          slug: StackTab.formatSlug(tabName),
          keys: {},
          rows: null,
        });
        await StackTab.upsert(name, tabs);
      }

      return res.status(200).send({ success: true });
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });
  /**
   * Rename tab
   */
  router.post('/:name/tabs/rename', async (req, res) => {
    try {
      const { name } = req.params;
      const { oldName, newName } = req.body;
      const existing = await StackTab.get(name);
      if (!existing) {
        return res.status(404).send();
      }
      if (!oldName) {
        return res.status(400).send('old-name-not-provided');
      }
      if (!newName) {
        return res.status(400).send('new-name-not-provided');
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
  /**
   * Delete tab
   */
  router.post('/:name/tabs/delete', async (req, res) => {
    try {
      const { name } = req.params;
      const { tabName } = req.body;
      const existing = await StackTab.get(name);
      if (!existing) {
        return res.status(404).send();
      }

      await StackTab.deleteTab({
        stackName: name,
        tabName,
      });

      return res.status(200).send({ success: true });
    } catch (err) {
      req.logger.error(err);
      return res.status(500).send();
    }
  });

  return router;
};
