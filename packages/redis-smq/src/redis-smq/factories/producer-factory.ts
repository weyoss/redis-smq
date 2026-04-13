/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { Producer } from '../../producer/index.js';
import { ICallback } from 'redis-smq-common';

export class ProducerFactory extends FactoryAbstract {
  /**
   * Creates a Producer instance.
   *
   * @returns {Producer} A new Producer instance
   */
  static create = (): Producer => {
    this.ensureInitialized();
    return this.track(new Producer());
  };

  /**
   * Convenience method to create and start a producer in one call.
   *
   * @param cb - (err) => void. If provided, returns Producer synchronously
   * @returns Promise with Producer if no callback, otherwise Producer
   */
  static startProducer(): Promise<Producer>;
  static startProducer(cb: ICallback): Producer;
  static startProducer(cb?: ICallback): Promise<Producer> | Producer {
    const producer = ProducerFactory.create();

    if (cb) {
      producer.run((err) => {
        if (err) return cb(err);
        cb(null);
      });
      return producer;
    }

    return (async () => {
      await producer.run();
      return producer;
    })();
  }
}
