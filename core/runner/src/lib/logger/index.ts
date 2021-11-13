import { debug } from 'debug';

type Debugger = (format: string, ...args: any[]) => void;

export interface Logger {
  debug: Debugger;
  info: Debugger;
  warn: Debugger;
  error: Debugger;
  prefix(prefix: string): Logger;
}

const prefixLogger = (logger: Logger, prefix: string): Logger => {
  const prefixedLogger: Logger = {
    debug: (format: string, ...args: any[]) =>
      logger.debug(`${prefix} ${format}`, ...args),
    info: (format: string, ...args: any[]) =>
      logger.info(`${prefix} ${format}`, ...args),
    warn: (format: string, ...args: any[]) =>
      logger.warn(`${prefix} ${format}`, ...args),
    error: (format: string, ...args: any[]) =>
      logger.error(`${prefix} ${format}`, ...args),
    prefix: (nestedPrefix) => prefixLogger(logger, `${prefix} ${nestedPrefix}`),
  };
  return prefixedLogger;
};

export const createLogger = (name: string): Logger => {
  const logger = {
    debug: debug(`metro:${name}:debug`),
    info: debug(`metro:${name}:info`),
    warn: debug(`metro:${name}:warn`),
    error: debug(`metro:${name}:error`),
    prefix: (prefix: string) => prefixLogger(logger, prefix),
  };
  return logger;
};
