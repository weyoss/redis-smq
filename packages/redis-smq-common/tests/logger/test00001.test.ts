/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  afterEach,
  MockInstance,
} from 'vitest';
import { logger } from '../../src/logger/logger.js';
import { ConsoleLogger, LoggerError } from '../../src/logger/index.js';
import { ILogger } from '../../src/logger/index.js';

describe('Logger', () => {
  // Reset the logger state before each test
  beforeEach(() => {
    logger.destroy();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getLogger', () => {
    it('should return a dummy logger when logging is disabled', () => {
      const log = logger.getLogger({ enabled: false });

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
      const log = logger.getLogger({ enabled: true });

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
      const log = logger.getLogger({ enabled: true }, testNamespace);

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
        logger.getLogger({ enabled: true }, 'invalid namespace with spaces');
      }).toThrow(LoggerError);

      expect(() => {
        logger.getLogger({ enabled: true }, '$');
      }).toThrow(LoggerError);
    });

    it('should use custom logger options when provided', () => {
      // Create a logger with custom options
      const log = logger.getLogger({
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

    it('should support custom date format', () => {
      const customDateFormat = () => 'CUSTOM_DATE';
      const log = logger.getLogger({
        enabled: true,
        options: {
          dateFormat: customDateFormat,
        },
      });

      const infoSpy: MockInstance<(...args: unknown[]) => void> = vi.spyOn(
        console,
        'info',
      );
      log.info('test message');

      const callArg: unknown = infoSpy.mock.calls[0][0];
      expect(typeof callArg).toBe('string');
      expect(callArg).toContain('CUSTOM_DATE');
    });
  });

  describe('setLogger', () => {
    it('should set a custom logger', () => {
      // Create a mock logger
      const mockLogger: ILogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      // Set the mock logger
      logger.setLogger(mockLogger);

      // Get the logger and use it
      const log = logger.getLogger({ enabled: true });
      log.info('test message');

      // Verify the mock was called
      expect(mockLogger.info).toHaveBeenCalledWith('test message');
    });

    it('should throw an error when trying to set logger multiple times', () => {
      // Set a logger first time
      const mockLogger1: ILogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      logger.setLogger(mockLogger1);

      // Try to set another logger
      const mockLogger2: ILogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      expect(() => {
        logger.setLogger(mockLogger2);
      }).toThrow(LoggerError);
    });
  });

  describe('destroy', () => {
    it('should reset the logger state', () => {
      // Set a custom logger
      const mockLogger: ILogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      logger.setLogger(mockLogger);

      // Destroy the logger
      logger.destroy();

      // Should be able to set a new logger after destroy
      const newMockLogger: ILogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      // This should not throw if destroy worked correctly
      expect(() => {
        logger.setLogger(newMockLogger);
      }).not.toThrow();

      // Get the logger and use it
      const log = logger.getLogger({ enabled: true });
      log.info('test message');

      // Verify the new mock was called
      expect(newMockLogger.info).toHaveBeenCalledWith('test message');
    });
  });

  describe('Integration tests', () => {
    it('should properly handle namespaced loggers with custom logger', () => {
      // Create a mock logger
      const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      logger.setLogger(mockLogger);

      // Get a namespaced logger
      const log = logger.getLogger({ enabled: true }, 'test-ns');
      log.info('test message');

      // The message should have the namespace prepended
      const infoMock: MockInstance<(...args: unknown[]) => void> =
        mockLogger.info;
      const calls: unknown[][] = infoMock.mock.calls;
      expect(calls.length).toBe(1);
      expect(typeof calls[0][0]).toBe('string');
      expect(calls[0][0]).toContain('[test-ns-');
      expect(calls[0][0]).toContain(']: test message');
    });

    it('should handle multiple namespaced loggers', () => {
      const log1 = logger.getLogger({ enabled: true }, 'ns1');
      const log2 = logger.getLogger({ enabled: true }, 'ns2');

      const infoSpy: MockInstance<(...args: unknown[]) => void> = vi.spyOn(
        console,
        'info',
      );

      log1.info('message from ns1');
      log2.info('message from ns2');

      expect(infoSpy).toHaveBeenCalledTimes(2);
      expect(infoSpy.mock.calls[0][0]).toContain('[ns1-');
      expect(infoSpy.mock.calls[1][0]).toContain('[ns2-');
    });
  });
});
