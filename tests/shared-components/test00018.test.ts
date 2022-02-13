import {
  getLogger,
  getNamespacedLogger,
  reset,
  setLogger,
} from '../../src/system/common/logger';
import { mockConfiguration } from '../common';
import * as Logger from 'bunyan';

test('Logger', async () => {
  expect(() => {
    setLogger(console);
  }).toThrow('Logger has been already initialized.');

  mockConfiguration({
    logger: {
      enabled: false,
    },
  });
  const logger1 = getLogger();
  expect(logger1 === console).toBe(false);

  mockConfiguration({
    logger: {
      enabled: true,
    },
  });

  const logger2 = getLogger();
  expect(logger2 === console).toBe(true);

  mockConfiguration({
    logger: {
      enabled: false,
    },
  });

  const logger3 = getNamespacedLogger('ns');
  expect(logger3 === logger1).toBe(true);

  mockConfiguration({
    logger: {
      enabled: true,
    },
  });

  const logger4 = getNamespacedLogger('ns');

  const mock1: jest.SpyInstance<
    void,
    [message?: unknown, ...optionalParams: unknown[]]
  > = jest.spyOn(console, 'info').mockImplementation();
  logger4.info('info');
  expect(console.info).toHaveBeenCalledTimes(1);
  expect(console.info).toHaveBeenLastCalledWith(`[ns] info`);
  mock1.mockRestore();

  const mock2: jest.SpyInstance<
    void,
    [message?: unknown, ...optionalParams: unknown[]]
  > = jest.spyOn(console, 'error').mockImplementation();
  logger4.error('error');
  expect(console.error).toHaveBeenCalledTimes(1);
  expect(console.error).toHaveBeenLastCalledWith(`[ns] error`);
  mock2.mockRestore();

  const mock3: jest.SpyInstance<
    void,
    [message?: unknown, ...optionalParams: unknown[]]
  > = jest.spyOn(console, 'debug').mockImplementation();
  logger4.debug('debug');
  expect(console.debug).toHaveBeenCalledTimes(1);
  expect(console.debug).toHaveBeenLastCalledWith(`[ns] debug`);
  mock3.mockRestore();

  const mock4: jest.SpyInstance<
    void,
    [message?: unknown, ...optionalParams: unknown[]]
  > = jest.spyOn(console, 'warn').mockImplementation();
  logger4.warn('warn');
  expect(console.warn).toHaveBeenCalledTimes(1);
  expect(console.warn).toHaveBeenLastCalledWith(`[ns] warn`);
  mock4.mockRestore();

  reset();
  const logger5 = getLogger();
  expect(logger5 instanceof Logger).toBe(true);
});
