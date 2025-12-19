/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsoleLogger } from './console-logger/index.js';
import { ILogger, ILoggerConfig } from './types/index.js';

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
 * Creates a logger instance based on the provided configuration and optional namespace.
 * If logging is disabled in the configuration, a dummy logger is returned.
 *
 * @param cfg - Logger configuration specifying if logging is enabled.
 * @param ns - Optional namespaces to prepend to each log message.
 * @returns An ILogger instance.
 * @throws LoggerError if the namespace is invalid.
 */
export function createLogger(
  cfg: ILoggerConfig = {},
  ns: string | string[] = [],
): ILogger {
  if (!cfg.enabled) {
    return dummyLogger;
  }
  return new ConsoleLogger(cfg.options, ns);
}
