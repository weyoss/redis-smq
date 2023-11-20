/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Producer } from '../../src/lib/producer/producer';
import { promisifyAll } from 'bluebird';
import { shutDownBaseInstance } from './base-instance';

const producersList: Producer[] = [];

export function getProducer() {
  const producer = new Producer();
  const p = promisifyAll(producer);
  producersList.push(p);
  return p;
}

export async function shutDownProducers() {
  for (const i of producersList) await shutDownBaseInstance(i);
}
