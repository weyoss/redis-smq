/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { ExchangeDirect } from '../../exchange/index.js';

export class DirectExchangeFactory extends FactoryAbstract {
  /**
   * Creates an ExchangeDirect instance.
   *
   * @returns {ExchangeDirect} A new ExchangeDirect instance
   */
  static create = (): ExchangeDirect => {
    this.ensureInitialized();
    return this.track(new ExchangeDirect());
  };
}
