/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { ExchangeFanout } from '../../exchange/index.js';

export class FanoutExchangeFactory extends FactoryAbstract {
  /**
   * Creates a new fanout exchange instance.
   *
   * @returns {ExchangeFanout} A new ExchangeFanout instance
   */
  static create = (): ExchangeFanout => {
    this.ensureInitialized();
    return this.track(new ExchangeFanout());
  };
}
