/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { NamespaceManager } from '../../namespace-manager/index.js';

export class NamespaceManagerFactory extends FactoryAbstract {
  /**
   * Creates a NamespaceManager instance.
   *
   * @returns {NamespaceManager} A new NamespaceManager instance
   */
  static create = (): NamespaceManager => {
    this.ensureInitialized();
    return this.track(new NamespaceManager());
  };
}
