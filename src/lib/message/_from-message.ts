/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageState } from './message-state';
import { IMessageSerialized, IMessageStateSerialized } from '../../../types';
import { Message } from './message';
import { _fromJSON } from '../exchange/_from-json';

export function _fromMessage(
  msg: string | Message,
  msgState: string | MessageState | null = null,
  resetState = false,
  resetProperties = false,
): Message {
  const { exchange, body, ...params }: IMessageSerialized =
    typeof msg === 'string' ? JSON.parse(msg) : msg.toJSON();

  // Properties
  const m = new Message();
  m.setBody(body);
  if (!resetProperties) {
    Object.assign(m, params);
  }

  // MessageState
  const messageStateInstance = new MessageState();
  if (!resetState) {
    if (msgState) {
      const messageStateJSON: IMessageStateSerialized =
        typeof msgState === 'string' ? JSON.parse(msgState) : msgState;
      Object.assign(messageStateInstance, messageStateJSON);
    } else if (msg instanceof Message) {
      const msgState = msg.getMessageState();
      if (msgState) {
        Object.assign(messageStateInstance, msgState.toJSON());
      }
    }
  }
  m.setMessageState(messageStateInstance);

  // Exchange
  if (exchange) m.setExchange(_fromJSON(exchange));

  return m;
}
