import { IConfig } from '../types';
import BLogger, { createLogger } from 'bunyan';

export function Logger(name: string, config: IConfig['log'] = {}): BLogger {
  if (!name) {
    throw new Error('Parameter [name] is required.');
  }
  const instance = createLogger({ ...(config.options ?? {}), name });
  if (!config.enabled) {
    const noop = () => void 0;
    return Object.assign(instance, {
      debug: noop,
      warn: noop,
      info: noop,
      trace: noop,
      fatal: noop,
      error: noop,
    });
  }
  return instance;
}
