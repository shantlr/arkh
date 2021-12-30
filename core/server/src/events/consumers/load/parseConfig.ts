import { forEach } from 'lodash';
import { MetroSpec, ServiceSpec, StackSpec } from '@shantr/metro-common-types';

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
): ServiceSpec => {
  if (typeof config !== 'object') {
    throw new InvalidConfig(`${stackName}.${name} is not an object`);
  }
  const res: Partial<ServiceSpec> = {
    logs: {
      json: false,
      delta: false,
      time: true,
    },
  };

  if (!('cmd' in config)) {
    throw new InvalidConfig(`${stackName}.${name}.cmd missing`);
  }

  if (typeof config.cmd === 'string') {
    res.cmd = config.cmd
      .split(' ')
      .map((c: string) => c.trim())
      .filter((c: string) => c);
  } else if (Array.isArray(config.cmd)) {
    config.cmd.forEach((elem) => {
      if (!['number', 'string', 'boolean'].includes(typeof elem)) {
        throw new InvalidConfig(`${stackName}.${name}.cmd is invalid`);
      }
    });

    res.cmd = config.cmd.map((elem) => elem.toString());
  }

  if ('pty' in config) {
    res.pty = Boolean(config.pty);
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
      throw new InvalidConfig(
        `service ${stackName}.${name} config env is not an object`
      );
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

  // Parse logs options
  if ('logs' in config) {
    if (typeof config.logs !== 'object') {
      throw new InvalidConfig(
        `service ${stackName}.${name} config logs is not an object`
      );
    }
    res.logs.json = Boolean(config.logs.json);
    res.logs.time = !('time' in config.logs) || Boolean(config.logs.time);
    res.logs.delta = Boolean(config.logs.delta);
  }

  return res as ServiceSpec;
};

export const parseStack = (name: string, config: any): StackSpec => {
  if (typeof config !== 'object') {
    throw new InvalidConfig(`stack '${name}' is not an object`);
  }

  const res: StackSpec = {
    services: {},
  };
  forEach(config, (serviceSpecServiceSpec, serviceName) => {
    res.services[serviceName] = parseService(
      serviceName,
      name,
      serviceSpecServiceSpec
    );
  });

  return res;
};

export const parseConfig = (config: any): MetroSpec => {
  if (typeof config !== 'object' || config === null) {
    throw new InvalidConfig('config is not an object');
  }
  const res: MetroSpec = {
    stacks: {},
  };
  if ('stacks' in config) {
    for (const key in config.stacks) {
      res.stacks[key] = parseStack(key, config.stacks[key]);
    }
  }

  return res;
};
