import { IConfig } from '../types';
import BLogger, { createLogger } from 'bunyan';

export function Logger(name: string, config: IConfig['log'] = {}): BLogger {
  const instance = createLogger({ name, ...(config.options ?? {}) });
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
