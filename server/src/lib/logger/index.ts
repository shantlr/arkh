import { debug, Debugger } from 'debug';

export interface Logger {
  debug: Debugger;
  info: Debugger;
  warn: Debugger;
  error: Debugger;
}

export const createLogger = (name: string): Logger => ({
  debug: debug(`metro:${name}:debug`),
  info: debug(`metro:${name}:info`),
  warn: debug(`metro:${name}:warn`),
  error: debug(`metro:${name}:error`),
});
