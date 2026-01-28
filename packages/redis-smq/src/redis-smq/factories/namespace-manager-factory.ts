/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// redis-smq/factories/namespace-manager-factory.ts
import { FactoryAbstract } from './factory-abstract.js';
import { NamespaceManager } from '../../namespace-manager/index.js';

export class NamespaceManagerFactory extends FactoryAbstract {
  /**
   * Creates a NamespaceManager instance.
   *
   * @returns A new NamespaceManager instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const namespaceManager = RedisSMQ.createNamespaceManager();
   * namespaceManager.getNamespaces((err, namespaces) => {
   *   if (err) return console.error('Failed to get namespaces:', err);
   *   console.log('Namespaces:', namespaces);
   * });
   * ```
   */
  static create = (): NamespaceManager => {
    this.ensureInitialized();
    return this.track(new NamespaceManager());
  };
}
