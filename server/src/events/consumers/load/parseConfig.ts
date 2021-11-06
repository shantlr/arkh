import { forEach } from 'lodash';
import { MetroConfig, ServiceConfig, StackConfig } from 'src/events/types';

export class InvalidConfig extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidConfig.prototype);
  }
}

export const parseService = (
  name: string,
  stackName: string,
  config: any
): ServiceConfig => {
  if (typeof config !== 'object') {
    throw new InvalidConfig(`${stackName}.${name} is not an object`);
  }
  const res: Partial<ServiceConfig> = {};

  if (!('cmd' in config)) {
    throw new InvalidConfig(`${stackName}.${name}.cmd missing`);
  }
  if (typeof config.cmd === 'string') {
    res.cmd = config.cmd.slice(' ');
  } else if (Array.isArray(config.cmd)) {
    config.cmd.forEach((elem) => {
      if (!['number', 'string', 'boolean'].includes(typeof elem)) {
        throw new InvalidConfig(`${stackName}.${name}.cmd is invalid`);
      }
    });

    res.cmd = config.cmd.map((elem) => elem.toString());
  }

  if ('path' in config) {
    if (typeof config.path !== 'string') {
      throw new InvalidConfig(
        `service ${stackName}.${name} is of invalid type`
      );
    }
    res.path = config.path;
  }

  if ('env' in config) {
    // Assert env
    if (typeof config.env !== 'object') {
      throw new InvalidConfig(`service ${stackName}.${name} is not an object`);
    }
    for (const envName in config.env) {
      if (
        !['number', 'string', 'boolean'].includes(typeof config.env[envName])
      ) {
        throw new InvalidConfig(
          `${stackName}.${name}.env.${envName} is of invalid type`
        );
      }
    }
    res.env = config.env;
  }

  return res as ServiceConfig;
};

export const parseStack = (name: string, config: any): StackConfig => {
  if (typeof config !== 'object') {
    throw new InvalidConfig(`stack '${name}' is not an object`);
  }

  const res: StackConfig = {
    services: {},
  };
  forEach(config, (serviceConfig, serviceName) => {
    res.services[name] = parseService(serviceName, name, serviceConfig);
  });

  return res;
};

export const parseConfig = (config: any): MetroConfig => {
  if (typeof config !== 'object') {
    throw new InvalidConfig('config is not an object');
  }
  const res: MetroConfig = {
    stacks: {},
  };
  if ('stacks' in config) {
    for (const key in config.stacks) {
      res.stacks[key] = parseStack(key, config.stacks[key]);
    }
  }

  return res;
};
