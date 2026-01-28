/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { StateManager } from '../state-manager.js';
import { PanicError } from 'redis-smq-common';
import { ComponentRegistry } from '../component-registry.js';

export abstract class FactoryAbstract {
  static ensureInitialized(): void {
    if (!StateManager.isRunning()) {
      throw new PanicError({
        message:
          'RedisSMQ is not initialized. Call RedisSMQ.initialize() first.',
      });
    }
  }

  protected static track<T extends object>(instance: T): T {
    return ComponentRegistry.track(instance);
  }
}
