import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { forEach, isEqual } from 'lodash';

import { createEventQueue } from 'src/lib/queue/createEvents';
import { HandlerContext } from 'src/lib/queue/base';
import { Entity } from 'src/data';
import { MetroConfig } from '../../types';
import { EVENTS } from '../..';
import { InvalidConfig, parseConfig } from './parseConfig';

export const loadQueue = createEventQueue('load', {
  async dir(dirPath: string, { dispatcher, logger }: HandlerContext) {
    try {
      const files = await fs.promises.readdir(dirPath, {
        withFileTypes: true,
      });
      files.forEach((file) => {
        if (file.isFile()) {
          dispatcher.push(loadQueue.file(path.resolve(dirPath, file.name)));
        }
      });
    } catch (err) {
      if (err.code === 'ENOENT') {
        logger.warn(`'${dirPath}' not found`);
        return;
      }
      throw err;
    }
  },
  async file(filePath: string, { logger, dispatcher }: HandlerContext) {
    try {
      const file = await fs.promises.readFile(filePath);
      const yaml = YAML.parse(file.toString());
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

      const existing = Entity.getOne('config', key);

      const config = parseConfig(configRaw);
      forEach(config.stacks, (stack, name) => {
        dispatcher.push(
          EVENTS.stack.save({
            name,
            spec: stack,
          })
        );
      });

      if (existing) {
        const prevConfig = existing.spec as MetroConfig;
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
          Entity.updateOne('config', key, {
            spec: config,
          });
        }
      } else {
        Entity.insertOne({
          name: key,
          type: 'config',
          spec: config,
          metadata: {},
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
});
