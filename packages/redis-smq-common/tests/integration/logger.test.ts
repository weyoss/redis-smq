/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../src/logger/logger.js';
import {
  ConsoleLogger,
  LoggerInvalidNamespaceError,
} from '../../src/logger/index.js';

describe('createLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a no-op logger when logging is disabled', () => {
    const log = createLogger({ enabled: false }, []);

    const debug = vi.spyOn(console, 'debug');
    const info = vi.spyOn(console, 'info');
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');

    log.debug('test');
    log.info('test');
    log.warn('test');
    log.error('test');

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('returns a ConsoleLogger by default when enabled', () => {
    const log = createLogger({ enabled: true }, []);

    expect(log).toBeInstanceOf(ConsoleLogger);
    expect(log).toHaveProperty('debug');
    expect(log).toHaveProperty('info');
    expect(log).toHaveProperty('warn');
    expect(log).toHaveProperty('error');

    const info = vi.spyOn(console, 'info');
    log.info('test message');
    expect(info).toHaveBeenCalled();
  });

  it('prefixes messages with the given namespace', () => {
    const log = createLogger({ enabled: true }, 'test-namespace');

    const info = vi.spyOn(console, 'info');
    log.info('test message');

    const arg = info.mock.calls[0][0];
    expect(typeof arg).toBe('string');
    expect(arg).toContain('test-namespace');
  });

  it('throws LoggerInvalidNamespaceError for an invalid namespace', () => {
    expect(() =>
      createLogger({ enabled: true }, 'invalid namespace with spaces'),
    ).toThrow(LoggerInvalidNamespaceError);

    expect(() => createLogger({ enabled: true }, '$')).toThrow(
      LoggerInvalidNamespaceError,
    );
  });

  it('respects the configured log level', () => {
    const log = createLogger(
      {
        enabled: true,
        options: {
          includeTimestamp: false,
          colorize: false,
          logLevel: 'WARN',
        },
      },
      [],
    );

    const debug = vi.spyOn(console, 'debug');
    const info = vi.spyOn(console, 'info');
    const warn = vi.spyOn(console, 'warn');

    log.debug('debug message');
    log.info('info message');
    log.warn('warn message');

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it('supports multiple namespaced loggers', () => {
    const log1 = createLogger({ enabled: true }, ['ns1', 'ns2']);
    const log2 = createLogger({ enabled: true }, 'ns3');

    const info = vi.spyOn(console, 'info');
    log1.info('message from ns1');
    log2.info('message from ns3');

    expect(info).toHaveBeenCalledTimes(2);
    expect(info.mock.calls[0][0]).toContain('(ns1 / ns2)');
    expect(info.mock.calls[1][0]).toContain('(ns3)');
  });
});
