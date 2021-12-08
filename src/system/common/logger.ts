import { IConfig } from '../../../types';
import BLogger, { createLogger } from 'bunyan';
import { ArgumentError } from './errors/argument.error';

export function Logger(name: string, config: IConfig['log']): BLogger {
  if (!name) {
    throw new ArgumentError('Parameter [name] is required.');
  }
  const cfg = config ?? {};
  const instance = createLogger({ ...(cfg.options ?? {}), name });
  if (!cfg.enabled) {
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
