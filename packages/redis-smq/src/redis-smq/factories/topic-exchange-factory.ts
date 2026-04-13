/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { ExchangeTopic } from '../../exchange/index.js';

export class TopicExchangeFactory extends FactoryAbstract {
  /**
   * Creates a new topic exchange instance.
   *
   * @returns {ExchangeTopic} A new topic exchange instance
   */
  static create = (): ExchangeTopic => {
    this.ensureInitialized();
    return this.track(new ExchangeTopic());
  };
}
