/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EExchangeType {
  DIRECT,
  FANOUT,
  TOPIC,
}

export const ExchangeTypeString = {
  [EExchangeType.DIRECT]: 'direct',
  [EExchangeType.TOPIC]: 'topic',
  [EExchangeType.FANOUT]: 'fanout',
} as const;

export type TExchangeType =
  (typeof ExchangeTypeString)[keyof typeof ExchangeTypeString];

export interface IExchangeParams {
  name: string;
  ns: string;
}

export interface IExchangeParsedParams extends IExchangeParams {
  type: EExchangeType;
}

export type TExchangeDeleteEventPayloadTotals = {
  totalQueues: number;
  totalRoutingKeys?: number;
  totalBindingPatterns?: number;
};

export type TExchangeDeleteEventPayload = {
  exchange: IExchangeParsedParams;
  totals: TExchangeDeleteEventPayloadTotals;
};
