/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it, vitest } from 'vitest';
import { logger } from '../../src/logger/logger.js';

it('Logger', async () => {
  logger.destroy();
  const logger0 = logger.getLogger({ enabled: true });
  expect(logger0 === console).toBe(true);

  expect(() => {
    logger.setLogger(console);
  }).toThrow('Logger has been already initialized.');

  logger.destroy();
  logger.setLogger(console);

  const logger1 = logger.getLogger({
    enabled: true,
  });
  expect(logger1 === console).toBe(true);

  const logger2 = logger.getLogger(
    {
      enabled: true,
    },
    'ns',
  );

  const mock1 = vitest.spyOn(console, 'info').mockImplementation(() => void 0);
  logger2.info('info');
  expect(console.info).toHaveBeenCalledTimes(1);
  expect(console.info).toHaveBeenLastCalledWith(`ns: info`);
  mock1.mockRestore();

  const mock2 = vitest.spyOn(console, 'error').mockImplementation(() => void 0);
  logger2.error('error');
  expect(console.error).toHaveBeenCalledTimes(1);
  expect(console.error).toHaveBeenLastCalledWith(`ns: error`);
  mock2.mockRestore();

  const mock3 = vitest.spyOn(console, 'debug').mockImplementation(() => void 0);
  logger2.debug('debug');
  expect(console.debug).toHaveBeenCalledTimes(1);
  expect(console.debug).toHaveBeenLastCalledWith(`ns: debug`);
  mock3.mockRestore();

  const mock4 = vitest.spyOn(console, 'warn').mockImplementation(() => void 0);
  logger2.warn('warn');
  expect(console.warn).toHaveBeenCalledTimes(1);
  expect(console.warn).toHaveBeenLastCalledWith(`ns: warn`);
  mock4.mockRestore();
});
