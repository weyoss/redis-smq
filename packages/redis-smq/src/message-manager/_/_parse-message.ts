/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../message/message-envelope.js';
import { ProducibleMessage } from '../../message/index.js';
import { EMessageProperty, IMessageParams } from '../../message/index.js';
import { _parseMessageState } from './_parse-message-state.js';

/**
 * Transforms Redis HGETALL result (string array) to Record<string, string>
 * Redis HGETALL returns: [key1, value1, key2, value2, ...]
 * This function converts it to: { key1: value1, key2: value2, ... }
 */
function arrayToRecord(rawData: string[]): Record<string, string> {
  const record: Record<string, string> = {};

  // Process pairs: even indices are keys, odd indices are values
  for (let i = 0; i < rawData.length; i += 2) {
    const key = rawData[i];
    const value = rawData[i + 1];

    // Only add if both key and value exist
    if (key !== undefined && value !== undefined) {
      record[key] = value;
    }
  }

  return record;
}

export function _parseMessage(
  rawData: Record<string, string> | string[],
): MessageEnvelope {
  const normalizedData: Record<string, string> = Array.isArray(rawData)
    ? arrayToRecord(rawData)
    : rawData;

  // ProducibleMessage
  const messageJSON: IMessageParams = JSON.parse(
    normalizedData[EMessageProperty.MESSAGE],
  );
  const { consumerGroupId, destinationQueue, ...message } = messageJSON;

  // ProducibleMessage
  const messagePub = new ProducibleMessage();
  Object.assign(messagePub, message);
  delete normalizedData[EMessageProperty.MESSAGE];

  // Status
  const status = Number(normalizedData[EMessageProperty.STATUS]);
  delete normalizedData[EMessageProperty.STATUS];

  // MessageState
  const messageState = _parseMessageState(normalizedData);

  // MessageEnvelope
  const messageEnvelope = new MessageEnvelope(messagePub, messageState, status);
  messageEnvelope.setDestinationQueue(destinationQueue);
  if (consumerGroupId) messageEnvelope.setConsumerGroupId(consumerGroupId);

  //
  return messageEnvelope;
}
