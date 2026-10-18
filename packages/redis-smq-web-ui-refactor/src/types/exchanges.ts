/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EExchangeType {
  DIRECT = 0,
  FANOUT = 1,
  TOPIC = 2,
}

export const ExchangeTypeString: Record<
  EExchangeType,
  'direct' | 'fanout' | 'topic'
> = {
  [EExchangeType.DIRECT]: 'direct',
  [EExchangeType.FANOUT]: 'fanout',
  [EExchangeType.TOPIC]: 'topic',
};

export const ExchangeTypeLabel: Record<EExchangeType, string> = {
  [EExchangeType.DIRECT]: 'Direct',
  [EExchangeType.FANOUT]: 'Fanout',
  [EExchangeType.TOPIC]: 'Topic',
};

export const ExchangeTypeIcon: Record<EExchangeType, string> = {
  [EExchangeType.DIRECT]: 'bi-arrow-right',
  [EExchangeType.FANOUT]: 'bi-broadcast',
  [EExchangeType.TOPIC]: 'bi-hash',
};

export enum EExchangeQueuePolicy {
  STANDARD = 0,
  PRIORITY = 1,
}

export const ExchangeQueuePolicyLabel: Record<EExchangeQueuePolicy, string> = {
  [EExchangeQueuePolicy.STANDARD]: 'Standard queues',
  [EExchangeQueuePolicy.PRIORITY]: 'Priority queues',
};

export const ExchangeQueuePolicyHint: Record<EExchangeQueuePolicy, string> = {
  [EExchangeQueuePolicy.STANDARD]: 'FIFO and LIFO queues',
  [EExchangeQueuePolicy.PRIORITY]: 'Priority-ordered queues only',
};
