import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { forEach, isEqual, keyBy } from 'lodash';

import { createEventQueue, handler, HandlerContext } from '@shantr/metro-queue';
import { Config, Stack } from '../../../data';
import { EVENTS } from '../..';
import { InvalidConfig, parseConfig } from './parseConfig';
import { YAMLError } from 'yaml/util';
import { ShipyardFileSpec } from '@shantlr/shipyard-common-types';

const listAllFiles = async (dirPath: string) => {
  const res: string[] = [];

  const dir = await fs.promises.readdir(dirPath, {
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

export const loadQueue = createEventQueue('load', {
  syncDir: handler(async (dirPath: string, { dispatcher, logger }) => {
    try {
      const filePaths = await listAllFiles(dirPath);

      const filePathMap = keyBy(filePaths);
      const configs = await Config.getAll();
      // remove config in db that are not found anymore
      configs.forEach((config) => {
        if (config.name.startsWith(dirPath) && !filePathMap[config.name]) {
          dispatcher.push(loadQueue.delete(config.name));
        }
      });

      // delete missing configs

      // load all file configs
      filePaths.forEach((filePath) => {
        dispatcher.push(loadQueue.file(filePath));
      });
    } catch (err) {
      if (err.code === 'ENOENT') {
        logger.warn(`'${dirPath}' not found`);
        return;
      }
      throw err;
    }
  }),
  async file(filePath: string, { logger, dispatcher }: HandlerContext) {
    try {
      const file = await fs.promises.readFile(filePath);
      const yaml = YAML.parse(file.toString(), {
        prettyErrors: true,
      });
      logger.info(`${filePath} parsed`);
      dispatcher.push(
        loadQueue.config({
          key: filePath,
          config: yaml,
        })
      );
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
  async config(
    { key, config: configRaw }: { key: string; config: any },
    { logger, dispatcher }: HandlerContext
  ) {
    try {
      if (!key) {
        logger.warn(`config key is missing: ${JSON.stringify(configRaw)}`);
        return;
      }

      const existing = await Config.getOne(key);

      const config = parseConfig(configRaw);
      forEach(config.stacks, (stack, name) => {
        dispatcher.push(
          EVENTS.stack.save({
            name,
            spec: stack,
            configKey: key,
          })
        );
      });

      if (existing) {
        const prevConfig = existing.spec as ShipyardFileSpec;
        // Remove missing stack
        forEach(prevConfig.stacks, (prevStack, prevStackName) => {
          if (!config.stacks[prevStackName]) {
            dispatcher.push(
              EVENTS.stack.remove({
                name: prevStackName,
              })
            );
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

  delete: handler(async (filePath: string, { dispatcher, logger }) => {
    const config = await Config.getOne(filePath);
    if (config) {
      await Config.removeOne(filePath);
      const stacks = await Stack.ofConfig(filePath);
      stacks.forEach((stack) => {
        dispatcher.push(
          EVENTS.stack.remove({
            name: stack.name,
          })
        );
      });
      logger.info(`'${filePath}' deleted`);
    } else {
      logger.warn(`'${filePath}' not deleted: not found`);
    }
  }),
});
