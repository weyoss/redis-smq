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
 * ConsoleLogger implements the ILogger interface and provides formatted logging
 * with timestamps, namespaces, and color-coded output to the console.
 *
 * This logger supports hierarchical namespacing through child logger creation,
 * configurable log levels, and customizable message formatting.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const logger = new ConsoleLogger();
 * logger.info('Hello world');
 *
 * // With configuration
 * const logger = new ConsoleLogger({
 *   logLevel: EConsoleLoggerLevel.DEBUG,
 *   colorize: true,
 *   includeTimestamp: true
 * });
 *
 * // With namespaces
 * const logger = new ConsoleLogger({}, ['app', 'service']);
 * logger.info('Service started'); // Output: [timestamp] INFO (app / service): Service started
 * ```
 */
export class ConsoleLogger implements ILogger {
  private readonly logLevel: EConsoleLoggerLevel;
  private readonly formatter: ConsoleMessageFormatter;
  private readonly options: IConsoleLoggerOptions;
  private readonly namespaces: string[];

  /**
   * Creates a new ConsoleLogger instance with the specified configuration and namespaces.
   *
   * @param options - Configuration options for the logger behavior and formatting
   * @param namespaces - Single namespace string or array of namespace strings for message categorization
   *
   * @throws {LoggerError} When any namespace is empty or contains invalid characters
   *
   * @example
   * ```typescript
   * // Default logger
   * const logger = new ConsoleLogger();
   *
   * // Configured logger
   * const logger = new ConsoleLogger({
   *   logLevel: EConsoleLoggerLevel.WARN,
   *   colorize: false,
   *   includeTimestamp: true
   * });
   *
   * // Logger with namespaces
   * const logger = new ConsoleLogger({}, ['api', 'auth']);
   * const logger2 = new ConsoleLogger({}, 'database');
   * ```
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

    this.options = options;
    this.logLevel =
      typeof logLevel === 'number' ? logLevel : EConsoleLoggerLevel[logLevel];

    const namespaceArr =
      typeof namespaces === 'string' ? [namespaces] : namespaces;
    this.namespaces = this.validateNamespaces(namespaceArr);

    this.formatter = new ConsoleMessageFormatter(
      {
        includeTimestamp,
        colorize,
      },
      this.namespaces,
    );
  }

  /**
   * Creates a child logger instance that inherits the parent's configuration and namespaces.
   * The child logger will have all parent namespaces plus an optional additional namespace,
   * creating a hierarchical logging structure.
   *
   * Child loggers maintain the same log level, formatting options, and behavior as their parent,
   * but extend the namespace chain for better message categorization.
   *
   * @param childNamespace - Optional namespace to append to the inherited namespace chain.
   *                        If not provided, child will have identical namespaces as parent.
   *
   * @returns A new ConsoleLogger instance with inherited configuration and extended namespaces
   *
   * @throws {LoggerError} When the child namespace is invalid (empty or contains invalid characters)
   *
   * @example
   * ```typescript
   * const parent = new ConsoleLogger({}, ['app', 'service']);
   *
   * // Child with additional namespace
   * const child = parent.createChild('database');
   * // child namespaces: ['app', 'service', 'database']
   *
   * // Child without additional namespace
   * const clone = parent.createChild();
   * // clone namespaces: ['app', 'service']
   *
   * // Grandchild logger
   * const grandchild = child.createChild('connection');
   * // grandchild namespaces: ['app', 'service', 'database', 'connection']
   * ```
   */
  public createChild(childNamespace?: string): ConsoleLogger {
    const childNamespaces = [...this.namespaces];

    // Add child namespace if provided
    if (childNamespace && childNamespace.trim() !== '') {
      childNamespaces.push(childNamespace);
    }

    // Create child logger with same options but extended namespaces
    return new ConsoleLogger(this.options, childNamespaces);
  }

  /**
   * Gets the current namespaces of this logger instance.
   * Returns a defensive copy to prevent external modification of the internal namespace array.
   *
   * @returns A copy of the current namespaces array
   *
   * @example
   * ```typescript
   * const logger = new ConsoleLogger({}, ['app', 'service']);
   * const namespaces = logger.getNamespaces();
   * console.log(namespaces); // ['app', 'service']
   *
   * // Modifying returned array doesn't affect logger
   * namespaces.push('modified');
   * console.log(logger.getNamespaces()); // Still ['app', 'service']
   * ```
   */
  public getNamespaces(): string[] {
    return [...this.namespaces];
  }

  /**
   * Gets the current minimum log level of this logger instance.
   * Messages with levels below this threshold will be suppressed.
   *
   * @returns The current log level enum value
   *
   * @example
   * ```typescript
   * const logger = new ConsoleLogger({ logLevel: EConsoleLoggerLevel.WARN });
   * console.log(logger.getLogLevel()); // 2 (EConsoleLoggerLevel.WARN)
   * ```
   */
  public getLogLevel(): EConsoleLoggerLevel {
    return this.logLevel;
  }

  /**
   * Checks if a specific log level would be logged by this instance.
   * Useful for conditional logging or performance optimization when constructing
   * expensive log messages.
   *
   * @param level - The log level to check against the current minimum level
   *
   * @returns `true` if the level would be logged, `false` if it would be suppressed
   *
   * @example
   * ```typescript
   * const logger = new ConsoleLogger({ logLevel: EConsoleLoggerLevel.WARN });
   *
   * console.log(logger.isLevelEnabled(EConsoleLoggerLevel.DEBUG)); // false
   * console.log(logger.isLevelEnabled(EConsoleLoggerLevel.ERROR)); // true
   *
   * // Conditional expensive logging
   * if (logger.isLevelEnabled(EConsoleLoggerLevel.DEBUG)) {
   *   logger.debug(expensiveDebugDataGeneration());
   * }
   * ```
   */
  public isLevelEnabled(level: EConsoleLoggerLevel): boolean {
    return this.shouldLog(level);
  }

  /**
   * Logs a debug message to the console with DEBUG level formatting.
   * Debug messages are typically used for detailed diagnostic information
   * that is only of interest when diagnosing problems.
   *
   * @param message - The primary message to log (any type, will be stringified if not a string)
   * @param params - Additional parameters to log alongside the message
   *
   * @example
   * ```typescript
   * logger.debug('User authentication started');
   * logger.debug('Request data:', { userId: 123, action: 'login' });
   * logger.debug({ complex: 'object', data: [1, 2, 3] });
   * ```
   */
  public debug(message: unknown, ...params: unknown[]): void {
    if (!this.shouldLog(EConsoleLoggerLevel.DEBUG)) return;

    const formattedMessage = this.formatter.format('DEBUG', message);
    console.debug(formattedMessage, ...params);
  }

  /**
   * Logs an error message to the console with ERROR level formatting.
   * Error messages indicate serious problems that should be investigated immediately.
   *
   * @param message - The primary error message to log (any type, will be stringified if not a string)
   * @param params - Additional parameters such as error objects, stack traces, or context data
   *
   * @example
   * ```typescript
   * logger.error('Database connection failed');
   * logger.error('Authentication error:', error);
   * logger.error('Critical system failure', { code: 500, details: errorDetails });
   * ```
   */
  public error(message: unknown, ...params: unknown[]): void {
    if (!this.shouldLog(EConsoleLoggerLevel.ERROR)) return;

    const formattedMessage = this.formatter.format('ERROR', message);
    console.error(formattedMessage, ...params);
  }

  /**
   * Logs an informational message to the console with INFO level formatting.
   * Info messages provide general information about application flow and important events.
   *
   * @param message - The primary informational message to log (any type, will be stringified if not a string)
   * @param params - Additional parameters to provide context or supplementary information
   *
   * @example
   * ```typescript
   * logger.info('Application started successfully');
   * logger.info('User logged in:', { userId: 123, username: 'john_doe' });
   * logger.info('Processing completed', { recordsProcessed: 1500, duration: '2.3s' });
   * ```
   */
  public info(message: unknown, ...params: unknown[]): void {
    if (!this.shouldLog(EConsoleLoggerLevel.INFO)) return;

    const formattedMessage = this.formatter.format('INFO', message);
    console.info(formattedMessage, ...params);
  }

  /**
   * Logs a warning message to the console with WARN level formatting.
   * Warning messages indicate potentially harmful situations that should be noted
   * but don't prevent the application from continuing.
   *
   * @param message - The primary warning message to log (any type, will be stringified if not a string)
   * @param params - Additional parameters to provide context about the warning condition
   *
   * @example
   * ```typescript
   * logger.warn('API rate limit approaching');
   * logger.warn('Deprecated method used:', { method: 'oldFunction', alternative: 'newFunction' });
   * logger.warn('Configuration missing, using defaults', { missingKeys: ['timeout', 'retries'] });
   * ```
   */
  public warn(message: unknown, ...params: unknown[]): void {
    if (!this.shouldLog(EConsoleLoggerLevel.WARN)) return;

    const formattedMessage = this.formatter.format('WARN', message);
    console.warn(formattedMessage, ...params);
  }

  /**
   * Validates an array of namespace strings to ensure they meet the required format.
   * Namespaces must be non-empty and contain only alphanumeric characters, underscores, and hyphens.
   * All namespaces are converted to lowercase for consistency.
   *
   * @param namespaces - Array of namespace strings to validate and normalize
   *
   * @returns Array of validated and normalized (lowercase) namespace strings
   *
   * @throws {LoggerError} When any namespace is empty, whitespace-only, or contains invalid characters
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
   * Messages with levels below the minimum threshold are suppressed for performance.
   *
   * @param level - The log level to check against the minimum configured level
   *
   * @returns `true` if the level meets or exceeds the minimum threshold, `false` otherwise
   */
  private shouldLog(level: EConsoleLoggerLevel): boolean {
    return level >= this.logLevel;
  }
}
