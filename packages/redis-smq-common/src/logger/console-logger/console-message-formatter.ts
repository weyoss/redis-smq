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
 * log levels, namespaces, and ANSI color codes.
 */
export class ConsoleMessageFormatter {
  private readonly namespaces: string[] = [];
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

  private readonly resetColor = '\u001b[0m';

  /**
   * Creates a new MessageFormatter instance.
   *
   * @param options - Configuration options for the formatter
   * @param namespace - Namespaces
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
    namespace: string[] = [],
  ) {
    const { includeTimestamp, colorize, dateFormat } = options;
    this.includeTimestamp = includeTimestamp !== false;
    this.colorize = colorize !== false;
    this.dateFormatter = dateFormat || ((date: Date) => date.toISOString());
    this.namespaces = namespace;
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
   * Formats a log message with an optional timestamp, namespace, and color.
   *
   * @param level - The log level
   * @param message - The message to log
   * @returns The formatted log message
   */
  public format(level: TConsoleLoggerLevelName, message: unknown): string {
    const timestamp = this.includeTimestamp
      ? `[${this.dateFormatter(new Date())}] `
      : '';

    const formattedMessage =
      typeof message === 'string' ? message : JSON.stringify(message);

    // Base formatted message without color
    const baseMessage = `${timestamp}${level}${this.formatNamespaces(this.namespaces)}: ${this.stripColorCodes(formattedMessage)}`;

    // Add color if enabled
    if (this.colorize && this.levelColors[level]) {
      return `${this.levelColors[level]}${baseMessage}${this.resetColor}`;
    }

    return baseMessage;
  }

  /**
   * Formats multiple namespaces into a string representation.
   * @param namespaces - Array of namespace strings.
   * @returns Formatted namespace string like [ns1 / ns2 / ns3].
   */
  protected formatNamespaces(namespaces: string[]): string {
    if (!namespaces.length) return '';
    return ` (${namespaces.join(' / ')})`;
  }
}
