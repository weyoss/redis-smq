/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
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

export interface IExchangeParams {
  name: string;
  ns: string;
}

export interface IExchangeParsedParams extends IExchangeParams {
  type: EExchangeType;
}
