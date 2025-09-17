/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from '../types/index.js';
import { ConsoleMessageFormatter } from './console-message-formatter.js';
import { EConsoleLoggerLevel, IConsoleLoggerOptions } from './types/index.js';
import { LoggerError } from '../errors/index.js';

/**
 * ConsoleLogger implements the ILogger interface and provides
 * formatted logging with timestamps to the console.
 */
export class ConsoleLogger implements ILogger {
  private readonly logLevel: EConsoleLoggerLevel;
  private readonly formatter: ConsoleMessageFormatter;

  /**
   * Creates a new ConsoleLogger instance.
   *
   * @param options - Configuration options for the logger
   * @param namespaces - Namespaces
   * @param options.includeTimestamp - Whether to include timestamps in log messages (default: true)
   * @param options.colorize - Whether to colorize log messages (default: true)
   * @param options.logLevel - Minimum log level to display (default: 'INFO')
   * @param options.dateFormat - Custom date formatter function (default: ISO string)
   */
  constructor(
    options: IConsoleLoggerOptions = {},
    namespaces: string | string[] = [],
  ) {
    const {
      includeTimestamp = true,
      colorize = true,
      logLevel = EConsoleLoggerLevel.INFO,
    } = options;

    this.logLevel =
      typeof logLevel === 'number' ? logLevel : EConsoleLoggerLevel[logLevel];

    const namespaceArr =
      typeof namespaces === 'string' ? [namespaces] : namespaces;
    const validatedNamespaces = this.validateNamespaces(namespaceArr);
    this.formatter = new ConsoleMessageFormatter(
      {
        includeTimestamp,
        colorize,
      },
      validatedNamespaces,
    );
  }

  /**
   * Validates a namespace string to ensure it meets the required format.
   * @param namespaces - The namespace string to validate.
   * @throws LoggerError if the namespace is invalid.
   */
  private validateNamespaces(namespaces: string[]): string[] {
    return namespaces.map((ns) => {
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

      return ns.toLowerCase();
    });
  }

  /**
   * Checks if the given log level should be logged based on the configured minimum log level.
   *
   * @param level - The log level to check
   * @returns Whether the log level should be logged
   */
  private shouldLog(level: EConsoleLoggerLevel): boolean {
    return level >= this.logLevel;
  }

  /**
   * Logs a debug message to the console.
   *
   * @param message - The message to log
   * @param params - Additional parameters to log
   */
  public debug(message: unknown, ...params: unknown[]): void {
    if (!this.shouldLog(EConsoleLoggerLevel.DEBUG)) return;

    const formattedMessage = this.formatter.format('DEBUG', message);
    console.debug(formattedMessage, ...params);
  }

  /**
   * Logs an error message to the console.
   *
   * @param message - The message to log
   * @param params - Additional parameters to log
   */
  public error(message: unknown, ...params: unknown[]): void {
    if (!this.shouldLog(EConsoleLoggerLevel.ERROR)) return;

    const formattedMessage = this.formatter.format('ERROR', message);
    console.error(formattedMessage, ...params);
  }

  /**
   * Logs an info message to the console.
   *
   * @param message - The message to log
   * @param params - Additional parameters to log
   */
  public info(message: unknown, ...params: unknown[]): void {
    if (!this.shouldLog(EConsoleLoggerLevel.INFO)) return;

    const formattedMessage = this.formatter.format('INFO', message);
    console.info(formattedMessage, ...params);
  }

  /**
   * Logs a warning message to the console.
   *
   * @param message - The message to log
   * @param params - Additional parameters to log
   */
  public warn(message: unknown, ...params: unknown[]): void {
    if (!this.shouldLog(EConsoleLoggerLevel.WARN)) return;

    const formattedMessage = this.formatter.format('WARN', message);
    console.warn(formattedMessage, ...params);
  }
}
