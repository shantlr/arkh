import { debug } from 'debug';

type Debugger = (format: string, ...args: any[]) => void;

export interface Logger {
  debug: Debugger;
  info: Debugger;
  warn: Debugger;
  error: Debugger;
  /**
   * Add message prefixed logger
   */
  prefix(prefix: string): Logger;
  /**
   * Extend logger name
   */
  extend(suffix: string): Logger;
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
    extend: (suffix) => prefixLogger(logger.extend(suffix), prefix),
  };
  return prefixedLogger;
};

export const createLogger = (name: string): Logger => {
  const logger: Logger = {
    debug: debug(`metro:${name}:debug`),
    info: debug(`metro:${name}:info`),
    warn: debug(`metro:${name}:warn`),
    error: debug(`metro:${name}:error`),
    prefix: (prefix) => prefixLogger(logger, prefix),
    extend: (suffix) => createLogger(`${name}:${suffix}`),
  };
  return logger;
};
