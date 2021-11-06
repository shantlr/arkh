import { debug, Debugger } from 'debug';

export interface Logger {
  debug: Debugger;
  info: Debugger;
  warn: Debugger;
  error: Debugger;
}

export const createLogger = (name: string): Logger => ({
  debug: debug(`${name}:debug`),
  info: debug(`${name}:info`),
  warn: debug(`${name}:warn`),
  error: debug(`${name}:error`),
});
