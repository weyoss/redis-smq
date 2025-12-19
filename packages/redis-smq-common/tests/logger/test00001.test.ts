/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect, vi, afterEach, MockInstance } from 'vitest';
import { createLogger } from '../../src/logger/logger.js';
import { ConsoleLogger, LoggerError } from '../../src/logger/index.js';

describe('Logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a dummy logger when logging is disabled', () => {
    const log = createLogger({ enabled: false });

    // Spy on console methods to ensure they're not called
    const consoleDebugSpy = vi.spyOn(console, 'debug');
    const consoleInfoSpy = vi.spyOn(console, 'info');
    const consoleWarnSpy = vi.spyOn(console, 'warn');
    const consoleErrorSpy = vi.spyOn(console, 'error');

    log.debug('test');
    log.info('test');
    log.warn('test');
    log.error('test');

    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should return a ConsoleLogger instance by default when enabled', () => {
    const log = createLogger({ enabled: true });

    // Check if the returned object is an instance of ConsoleLogger
    expect(log).toBeInstanceOf(ConsoleLogger);

    // Check if the returned object has the expected logger methods
    expect(log).toHaveProperty('debug');
    expect(log).toHaveProperty('info');
    expect(log).toHaveProperty('warn');
    expect(log).toHaveProperty('error');

    // Verify it's a ConsoleLogger by checking if it logs to console
    const consoleSpy = vi.spyOn(console, 'info');
    log.info('test message');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return a namespaced logger when namespace is provided', () => {
    const testNamespace = 'test-namespace';
    const log = createLogger({ enabled: true }, testNamespace);

    const consoleSpy: MockInstance<(...args: unknown[]) => void> = vi.spyOn(
      console,
      'info',
    );
    log.info('test message');

    // Check if the namespace is included in the log message
    const callArg: unknown = consoleSpy.mock.calls[0][0];
    expect(typeof callArg).toBe('string');
    expect(callArg).toContain(testNamespace);
  });

  it('should throw an error for invalid namespace', () => {
    expect(() => {
      createLogger({ enabled: true }, 'invalid namespace with spaces');
    }).toThrow(LoggerError);

    expect(() => {
      createLogger({ enabled: true }, '$');
    }).toThrow(LoggerError);
  });

  it('should use custom logger options when provided', () => {
    // Create a logger with custom options
    const log = createLogger({
      enabled: true,
      options: {
        includeTimestamp: false,
        colorize: false,
        logLevel: 'WARN',
      },
    });

    // Debug and info should not log when level is WARN
    const debugSpy = vi.spyOn(console, 'debug');
    const infoSpy = vi.spyOn(console, 'info');
    const warnSpy = vi.spyOn(console, 'warn');

    log.debug('debug message');
    log.info('info message');
    log.warn('warn message');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should handle multiple namespaced loggers', () => {
    const log1 = createLogger({ enabled: true }, ['ns1', 'ns2']);
    const log2 = createLogger({ enabled: true }, 'ns3');

    const infoSpy: MockInstance<(...args: unknown[]) => void> = vi.spyOn(
      console,
      'info',
    );

    log1.info('message from ns1');
    log2.info('message from ns3');

    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(infoSpy.mock.calls[0][0]).toContain('(ns1 / ns2)');
    expect(infoSpy.mock.calls[1][0]).toContain('(ns3)');
  });
});
