/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { IRedisSMQParsedConfig } from '../../config/index.js';

/**
 * IConsumerContext provides a shared container for dependencies that are passed
 * down through the consumer's component hierarchy. This pattern enables
 * dependency injection, decouples components from each other, and eliminates
 * the need for global singletons, making the system more modular and testable.
 */
export interface IConsumerContext {
  /**
   * The unique identifier of the parent consumer instance.
   */
  readonly consumerId: string;

  /**
   * The application configuration object.
   */
  readonly config: IRedisSMQParsedConfig;

  /**
   * A logger instance, typically pre-configured with a namespace for the consumer.
   */
  readonly logger: ILogger;
}
