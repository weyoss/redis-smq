import { createLogger } from 'bunyan';
import { getConfiguration } from './configuration';
import { ICompatibleLogger } from '../../../types';
import { LoggerError } from './errors/logger.error';

let loggerInstance: ICompatibleLogger | null = null;

export function setUpDefaultLogger(): ICompatibleLogger {
  const cfg = getConfiguration().logger;
  loggerInstance = createLogger({ ...(cfg.options ?? {}), name: 'redis-smq' });
  return loggerInstance;
}

export function setLogger<T extends ICompatibleLogger>(logger: T): void {
  if (loggerInstance) {
    throw new LoggerError('Logger has been already initialized.');
  }
  loggerInstance = logger;
}

export function getLogger(): ICompatibleLogger {
  const { logger } = getConfiguration();
  if (!logger.enabled) {
    const noop = () => void 0;
    return {
      debug: noop,
      warn: noop,
      info: noop,
      error: noop,
    };
  }
  if (loggerInstance) return loggerInstance;
  return setUpDefaultLogger();
}

export function getNamespacedLogger(namespace: string): ICompatibleLogger {
  const logger = getLogger();
  const log =
    (key: keyof ICompatibleLogger) =>
    (message: unknown, ...params: unknown[]): void => {
      const msg =
        typeof message === 'string' ? `[${namespace}] ${message}` : message;
      return logger[key](msg, ...params);
    };
  return {
    info: log('info'),
    warn: log('warn'),
    debug: log('debug'),
    error: log('error'),
  };
}
