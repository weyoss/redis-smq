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
   * @param options.includeTimestamp - Whether to include timestamps in log messages (default: true)
   * @param options.colorize - Whether to colorize log messages (default: true)
   * @param options.logLevel - Minimum log level to display (default: 'DEBUG')
   * @param options.dateFormat - Custom date formatter function (default: ISO string)
   */
  constructor(options: IConsoleLoggerOptions = {}) {
    const {
      includeTimestamp = true,
      colorize = true,
      logLevel = EConsoleLoggerLevel.DEBUG,
      dateFormat,
    } = options;

    this.logLevel =
      typeof logLevel === 'number' ? logLevel : EConsoleLoggerLevel[logLevel];

    this.formatter = new ConsoleMessageFormatter({
      includeTimestamp,
      colorize,
      dateFormat,
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
   * Checks if a message already contains a timestamp and log level.
   * Takes into account possible ANSI color codes in the message.
   *
   * @param message - The message to check
   * @returns Whether the message already contains a timestamp and log level
   */
  public isFormatted(message: unknown): boolean {
    return this.formatter.isFormatted(message);
  }

  /**
   * Logs a debug message to the console.
   *
   * @param message - The message to log
   * @param params - Additional parameters to log
   */
  public debug(message: unknown, ...params: unknown[]): void {
    if (!this.shouldLog(EConsoleLoggerLevel.DEBUG)) return;

    if (this.isFormatted(message)) {
      return console.debug(message, ...params);
    }
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

    if (this.isFormatted(message)) {
      return console.error(message, ...params);
    }
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

    if (this.isFormatted(message)) {
      return console.info(message, ...params);
    }
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

    if (this.isFormatted(message)) {
      return console.warn(message, ...params);
    }
    const formattedMessage = this.formatter.format('WARN', message);
    console.warn(formattedMessage, ...params);
  }
}
