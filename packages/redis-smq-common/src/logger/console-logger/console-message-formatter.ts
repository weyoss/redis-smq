/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  TConsoleLoggerLevelName,
  TConsoleLoggerOptionsDateFormatter,
} from './types/index.js';

/**
 * ConsoleMessageFormatter handles the formatting of log messages with timestamps,
 * log levels, and ANSI color codes.
 */
export class ConsoleMessageFormatter {
  private readonly includeTimestamp: boolean;
  private readonly colorize: boolean;
  private readonly dateFormatter: TConsoleLoggerOptionsDateFormatter;

  // Color codes for different log levels
  private readonly levelColors: Record<TConsoleLoggerLevelName, string> = {
    DEBUG: '\u001b[36m', // Cyan
    INFO: '\u001b[32m', // Green
    WARN: '\u001b[33m', // Yellow
    ERROR: '\u001b[31m', // Red
  };

  private resetColor = '\u001b[0m';

  /**
   * Creates a new MessageFormatter instance.
   *
   * @param options - Configuration options for the formatter
   * @param options.includeTimestamp - Whether to include timestamps in log messages (default: true)
   * @param options.colorize - Whether to colorize log messages (default: true)
   * @param options.dateFormat - Custom date formatter function (default: ISO string)
   */
  constructor(
    options: {
      includeTimestamp?: boolean;
      colorize?: boolean;
      dateFormat?: TConsoleLoggerOptionsDateFormatter;
    } = {},
  ) {
    const { includeTimestamp, colorize, dateFormat } = options;
    this.includeTimestamp = includeTimestamp !== false;
    this.colorize = colorize !== false;
    this.dateFormatter = dateFormat || ((date: Date) => date.toISOString());
  }

  /**
   * Strips ANSI color codes from a string.
   *
   * @param str - The string to strip color codes from
   * @returns The string without color codes
   */
  public stripColorCodes(str: string): string {
    // This regex matches all ANSI color/style codes
    return str.replace(
      // eslint-disable-next-line no-control-regex
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      '',
    );
  }

  /**
   * Checks if a message already contains a timestamp and log level.
   * Takes into account possible ANSI color codes in the message.
   *
   * @param message - The message to check
   * @returns Whether the message already contains a timestamp and log level
   */
  public isFormatted(message: unknown): boolean {
    if (typeof message !== 'string') return false;

    // Strip any ANSI color codes before checking the format
    const strippedMessage = this.stripColorCodes(message);

    // Check for timestamp pattern followed by any log level in brackets
    // This is a simplified check that may need to be adjusted based on dateFormat
    const timestampLevelPattern = /^\[.+\] \[[A-Z]+\]/;

    // If we're not including timestamps, just check for any log level in brackets
    if (!this.includeTimestamp) {
      const anyLevelPattern = /^\[[A-Z]+\]/;
      return anyLevelPattern.test(strippedMessage);
    }

    return timestampLevelPattern.test(strippedMessage);
  }

  /**
   * Formats a log message with an optional timestamp, namespace, and color.
   *
   * @param level - The log level
   * @param message - The message to log
   * @returns The formatted log message
   */
  public format(level: TConsoleLoggerLevelName, message: unknown): string {
    // If the message is already formatted, return it as is
    if (this.isFormatted(message)) {
      return String(message);
    }

    const timestamp = this.includeTimestamp
      ? `[${this.dateFormatter(new Date())}] `
      : '';

    const formattedMessage =
      typeof message === 'string' ? message : JSON.stringify(message);

    // Base formatted message without color
    const baseMessage = `${timestamp}[${level}] ${this.stripColorCodes(formattedMessage)}`;

    // Add color if enabled
    if (this.colorize && this.levelColors[level]) {
      return `${this.levelColors[level]}${baseMessage}${this.resetColor}`;
    }

    return baseMessage;
  }
}
