/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { randomUUID } from 'node:crypto';
import { ConsoleLogger } from './console-logger/index.js';
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
 * Validates a namespace string to ensure it meets the required format.
 * @param ns - The namespace string to validate.
 * @throws LoggerError if the namespace is invalid.
 */
function validateNamespace(ns: string): void {
  if (!ns || ns.trim() === '') {
    throw new LoggerError('Namespace cannot be empty');
  }

  // Only allow alphanumeric characters, underscores, and hyphens
  const validNamespacePattern = /^[a-zA-Z0-9_-]+$/;
  if (!validNamespacePattern.test(ns)) {
    throw new LoggerError(
      'Namespace must contain only alphanumeric characters, underscores, and hyphens',
    );
  }
}

/**
 * Checks if a message already contains any namespace prefix.
 * @param message - The message to check.
 * @returns Boolean indicating if the message already has a namespace.
 */
function hasNamespace(message: unknown): boolean {
  if (typeof message !== 'string') return false;

  // Check if the message starts with a namespace pattern like "[any-namespace-uuid]:"
  const namespacePattern = /^\[[a-zA-Z0-9_-]+-[0-9a-f-]+\]:/;
  return namespacePattern.test(message);
}

/**
 * Wraps the logger methods to prepend a namespace and log type to each log message.
 * @param ns - The namespace string to prepend.
 * @param logger - The underlying logger instance.
 * @returns A namespaced logger implementing ILogger.
 * @throws LoggerError if the namespace is invalid.
 */
function createNamespacedLogger(ns: string, logger: ILogger): ILogger {
  // Validate the namespace before using it
  validateNamespace(ns);

  const nsId = `${ns}-${randomUUID()}`;

  // Helper to wrap each logging method with a namespace prefix and log type.
  const wrap = (
    method: keyof ILogger,
  ): ((message: unknown, ...params: unknown[]) => void) => {
    return (message: unknown, ...params: unknown[]): void => {
      // Skip adding namespace if:
      // 1. Message is not a string, OR
      // 2. Using ConsoleLogger and message is already formatted with timestamp and log level, OR
      // 3. Message already has a namespace
      const skipNamespace =
        typeof message !== 'string' ||
        (logger instanceof ConsoleLogger && logger.isFormatted(message)) ||
        hasNamespace(message);

      const msg = skipNamespace ? message : `[${nsId}]: ${message}`;
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
 * @throws LoggerError if the namespace is invalid.
 */
function getLogger(cfg: ILoggerConfig = {}, ns?: string): ILogger {
  if (!cfg.enabled) {
    return dummyLogger;
  }
  if (instance === null) {
    // Default to ConsoleLogger if no logger has been set.
    instance = new ConsoleLogger(cfg.options);
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
