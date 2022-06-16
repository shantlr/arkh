import fs from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';
import { baseLogger, config } from '../config';
import { State } from '.';

export const loadConfig = () => {
  const logger = baseLogger.extend('load-config');

  const configPath = path.resolve(config.get('config.path'));
  try {
    const stat = fs.statSync(configPath);
    if (stat.isFile()) {
      const content = JSON.parse(fs.readFileSync(configPath).toString());
      if (!content.runner_id) {
        throw new Error(`config file is invaild: field 'runner_id' is missing`);
      }
      State.runner.init(content.runner_id);
    } else {
      throw new Error(`${configPath} is not a file`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.info('config file not found. initializing a new config');
      fs.mkdirSync(path.parse(configPath).dir, {
        recursive: true,
      });
      const newConfig = {
        runner_id: nanoid(8),
      };
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, '  '));
      logger.info(`new config wrote`);
      State.runner.init(newConfig.runner_id);
    } else {
      throw err;
    }
  }
  logger.info(`loaded: '${State.runner.getId()}'`);
};
