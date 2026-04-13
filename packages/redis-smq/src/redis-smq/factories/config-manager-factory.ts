/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { ConfigManager } from '../../config-manager/index.js';

export class ConfigManagerFactory extends FactoryAbstract {
  /**
   * Creates a ConfigManager instance.
   *
   * @returns {ConfigManager} A new ConfigManager instance
   */
  static create = (): ConfigManager => {
    this.ensureInitialized();
    return this.track(new ConfigManager());
  };
}
