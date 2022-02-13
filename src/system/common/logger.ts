import { createLogger } from 'bunyan';
import { getConfiguration } from './configuration';
import { ICompatibleLogger } from '../../../types';
import { LoggerError } from './errors/logger.error';

const noop = () => void 0;
const dummyLogger = {
  debug: noop,
  warn: noop,
  info: noop,
  error: noop,
};

let loggerInstance: ICompatibleLogger | null = null;

function createDefaultLogger(): ICompatibleLogger {
  const cfg = getConfiguration().logger;
  return createLogger({ ...(cfg.options ?? {}), name: 'redis-smq' });
}

export function reset(): void {
  loggerInstance = null;
}

export function setLogger<T extends ICompatibleLogger>(logger: T): void {
  if (loggerInstance) {
    throw new LoggerError('Logger has been already initialized.');
  }
  loggerInstance = logger;
}

export function getLogger(): ICompatibleLogger {
  const cfg = getConfiguration().logger;
  if (!cfg.enabled) {
    return dummyLogger;
  }
  if (!loggerInstance) {
    loggerInstance = createDefaultLogger();
  }
  return loggerInstance;
}

export function getNamespacedLogger(namespace: string): ICompatibleLogger {
  const { logger } = getConfiguration();
  const instance = getLogger();
  if (!logger.enabled) {
    return instance;
  }
  const wrap =
    (key: keyof ICompatibleLogger) =>
    (message: unknown, ...params: unknown[]): void => {
      const msg =
        typeof message === 'string' ? `[${namespace}] ${message}` : message;
      return instance[key](msg, ...params);
    };
  return {
    info: wrap('info'),
    warn: wrap('warn'),
    debug: wrap('debug'),
    error: wrap('error'),
  };
}
