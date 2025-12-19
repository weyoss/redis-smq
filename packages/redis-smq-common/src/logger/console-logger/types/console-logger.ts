/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Enum representing log levels with their numeric values.
 * Higher values indicate higher severity.
 */
export enum EConsoleLoggerLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Type for log level names
 */
export type TConsoleLoggerLevelName = keyof typeof EConsoleLoggerLevel;

/**
 * Type for date format function
 */
export type TConsoleLoggerOptionsDateFormatter = (date: Date) => string;

export interface IConsoleLoggerOptions {
  /**
   * Whether to include timestamps in log messages
   * @default true
   */
  includeTimestamp?: boolean;

  /**
   * Whether to colorize log messages with ANSI color codes
   * @default true
   */
  colorize?: boolean;

  /**
   * Minimum log level to display
   * Can be specified as a string ('DEBUG', 'INFO', 'WARN', 'ERROR') or
   * using the numeric enum values from EConsoleLoggerLevel
   * Messages with a level lower than this will be suppressed
   * @default EConsoleLoggerLevel.DEBUG (0)
   */
  logLevel?: TConsoleLoggerLevelName | EConsoleLoggerLevel;
}
