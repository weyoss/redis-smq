/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { LoggerError } from './errors/index.js';
import { ILogger, ILoggerConfig } from './types/index.js';

// Global instance for the configured logger.
let instance: ILogger | null = null;

// A no-operation function used in the dummy logger.
const noop = (): void => void 0;

// A dummy logger that performs no operations. It is frozen to avoid any future modification.
const dummyLogger: ILogger = Object.freeze({
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
});

/**
 * Clears the global logger instance.
 */
function destroy(): void {
  instance = null;
}

/**
 * Sets the global logger instance.
 * @param logger - An instance implementing ILogger to be used as the logger.
 * @throws LoggerError if a logger is already set.
 */
function setLogger<T extends ILogger>(logger: T): void {
  if (instance !== null) {
    throw new LoggerError('Logger has already been initialized.');
  }
  instance = logger;
}

/**
 * Wraps the logger methods to prepend a namespace to each log message.
 * @param ns - The namespace string to prepend.
 * @param logger - The underlying logger instance.
 * @returns A namespaced logger implementing ILogger.
 */
function createNamespacedLogger(ns: string, logger: ILogger): ILogger {
  // Helper to wrap each logging method with a namespace prefix.
  const wrap = (
    method: keyof ILogger,
  ): ((message: unknown, ...params: unknown[]) => void) => {
    return (message: unknown, ...params: unknown[]): void => {
      const msg = typeof message === 'string' ? `${ns}: ${message}` : message;
      logger[method](msg, ...params);
    };
  };
  return {
    debug: wrap('debug'),
    info: wrap('info'),
    warn: wrap('warn'),
    error: wrap('error'),
  };
}

/**
 * Retrieves a logger instance based on the provided configuration and optional namespace.
 * If logging is disabled in the configuration, a dummy logger is returned.
 * If no logger has been previously set, the built-in console is used.
 *
 * @param cfg - Logger configuration specifying if logging is enabled.
 * @param ns - Optional namespace to prepend to each log message.
 * @returns An ILogger instance.
 */
function getLogger(cfg: ILoggerConfig, ns?: string): ILogger {
  if (!cfg.enabled) {
    return dummyLogger;
  }
  if (instance === null) {
    // Default to Node.js' console if no logger has been set.
    instance = console;
  }
  // If a namespace is provided, return a namespaced logger wrapper.
  if (typeof ns === 'string' && ns.trim() !== '') {
    return createNamespacedLogger(ns, instance);
  }
  return instance;
}

export const logger = {
  getLogger,
  setLogger,
  destroy,
};
