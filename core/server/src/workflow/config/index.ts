import { readdir, readFile } from 'fs/promises';
import path from 'path';

import { createEntity } from '@shantlr/workflow';
import { ShipyardFileSpec } from '@shantlr/shipyard-common-types';
import { forEach, isEqual, keyBy } from 'lodash';
import YAML from 'yaml';
import { YAMLError } from 'yaml/util';

import { Config, Stack } from '../../data';
import { stacksWorkflow } from '../stack';
import { baseLogger } from '../../config';

import { InvalidConfig, parseConfig } from './parseConfig';

const listAllFiles = async (dirPath: string) => {
  const res: string[] = [];

  const dir = await readdir(dirPath, {
    withFileTypes: true,
  });
  await Promise.all(
    dir.map(async (file) => {
      if (file.isFile()) {
        res.push(path.resolve(dirPath, file.name));
      } else if (file.isDirectory()) {
        res.push(...(await listAllFiles(path.resolve(dirPath, file.name))));
      }
    })
  );

  return res;
};

const logger = baseLogger.extend('config');
export const configsWorkflow = createEntity(null, {
  actions: {
    async syncDir(dirPath: string, api) {
      try {
        const filePaths = await api.call(() => listAllFiles(dirPath));

        const filePathMap = keyBy(filePaths);
        const configs = await api.call(() => Config.getAll());

        // remove config in db that are not found anymore
        configs.forEach((config) => {
          if (config.name.startsWith(dirPath) && !filePathMap[config.name]) {
            configsWorkflow.actions.delete(config.name);
          }
        });

        // load all file configs
        filePaths.forEach((filePath) => {
          configsWorkflow.actions.loadFile(filePath);
        });
      } catch (err) {
        if (err.code === 'ENOENT') {
          logger.warn(`'${dirPath}' not found`);
          return;
        }
        throw err;
      }
    },
    async delete(name: string) {
      const config = await Config.getOne(name);
      if (config) {
        await Config.removeOne(name);
        const stacks = await Stack.ofConfig(name);
        stacks.forEach((stack) => {
          stacksWorkflow.get(stack.name).actions.remove();
        });
        logger.info(`'${name}' deleted`);
      } else {
        logger.warn(`'${name}' not deleted: not found`);
      }
    },
    async loadFile(filePath: string) {
      try {
        const file = await readFile(filePath);
        const yaml = YAML.parse(file.toString(), {
          prettyErrors: true,
        });
        logger.info(`${filePath} parsed`);
        configsWorkflow.actions.loadConfig({
          key: filePath,
          config: yaml,
        });
      } catch (err) {
        if (err.code === 'ENOENT') {
          logger.warn(`'${filePath}' not found`);
          return;
        }
        if (err instanceof YAMLError) {
          logger.error(`${err.message}: %O`, err.source);
          logger.warn(`could not parse '${filePath}', config not loaded`);
          return;
        }
        throw err;
      }
    },
    async loadConfig({ key, config: configRaw }: { key: string; config: any }) {
      try {
        if (!key) {
          logger.warn(`config key is missing: ${JSON.stringify(configRaw)}`);
          return;
        }

        const existing = await Config.getOne(key);

        const config = parseConfig(configRaw);
        forEach(config.stacks, (stack, name) => {
          stacksWorkflow.get(name).actions.save({
            spec: stack,
            configKey: key,
          });
        });

        if (existing) {
          const prevConfig = existing.spec as ShipyardFileSpec;
          // Remove missing stack
          forEach(prevConfig.stacks, (prevStack, prevStackName) => {
            if (!config.stacks[prevStackName]) {
              stacksWorkflow.get(prevStackName).actions.remove();
            }
          });

          // Save config
          if (!isEqual(prevConfig, config)) {
            // Update if changed
            await Config.updateOne(key, {
              spec: config,
            });
          }
        } else {
          await Config.insertOne({
            name: key,
            spec: config,
          });
        }

        logger.info(`${key} loaded`);
      } catch (err) {
        if (err instanceof InvalidConfig) {
          logger.warn(`could not parse '${key}': ${err.message}`);
          logger.error(`config '${key}' not loaded`);
          return;
        }
        throw err;
      }
    },
  },
});
