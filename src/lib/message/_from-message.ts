/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageState } from './message-state';
import {
  EMessagePropertyStatus,
  IMessageSerialized,
  IMessageStateSerialized,
} from '../../../types';
import { MessageEnvelope } from './message-envelope';
import { _fromJSON } from '../exchange/_from-json';

export function _fromMessage(
  msg: string | MessageEnvelope,
  status: EMessagePropertyStatus | null,
  msgState: string | MessageState | null,
): MessageEnvelope {
  const { exchange, ...params }: IMessageSerialized =
    typeof msg === 'string' ? JSON.parse(msg) : msg.toJSON();

  // Properties
  const m = new MessageEnvelope();
  Object.assign(m, params);

  // Status
  if (status !== null) {
    m.setStatus(status);
  }

  // MessageState
  if (msgState !== null) {
    const messageStateInstance = new MessageState();
    const messageStateJSON: IMessageStateSerialized =
      typeof msgState === 'string' ? JSON.parse(msgState) : msgState;
    Object.assign(messageStateInstance, messageStateJSON);
    m.setMessageState(messageStateInstance);
  }

  // Exchange
  if (exchange) m.setExchange(_fromJSON(exchange));

  return m;
}
