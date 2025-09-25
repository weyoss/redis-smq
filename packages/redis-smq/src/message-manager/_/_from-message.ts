/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeType } from '../../exchange/index.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import { MessageState } from '../../message/message-state.js';
import {
  EMessagePropertyStatus,
  ProducibleMessage,
} from '../../message/index.js';

/**
 * Creates a deep copy of a MessageEnvelope instance. This factory is used
 * internally to create new message instances from existing ones, for example
 * when requeueing or rescheduling a message.
 *
 * @param sourceEnvelope - The original MessageEnvelope to clone.
 * @param resetStatus - If true, the new message status is reset to NEW.
 *                      Otherwise, the status is copied from the source.
 * @param resetState - If true, a fresh MessageState with a new ID is created.
 *                     Otherwise, the state (including ID) is cloned from the source.
 * @returns A new MessageEnvelope instance.
 */
export function _fromMessage(
  sourceEnvelope: MessageEnvelope,
  resetStatus = true,
  resetState = true,
): MessageEnvelope {
  // Manually clone the ProducibleMessage.
  // Note: This creates a new `createdAt` timestamp, which will affect TTL calculations.
  const producibleMessage = sourceEnvelope.producibleMessage;
  const newProducibleMsg = new ProducibleMessage();
  newProducibleMsg.setTTL(producibleMessage.getTTL());
  newProducibleMsg.setRetryThreshold(producibleMessage.getRetryThreshold());
  newProducibleMsg.setRetryDelay(producibleMessage.getRetryDelay());
  newProducibleMsg.setConsumeTimeout(producibleMessage.getConsumeTimeout());
  newProducibleMsg.setBody(producibleMessage.getBody());
  const priority = producibleMessage.getPriority();
  if (priority !== null) {
    newProducibleMsg.setPriority(priority);
  }
  const cron = producibleMessage.getScheduledCRON();
  if (cron) {
    newProducibleMsg.setScheduledCRON(cron);
  }
  const delay = producibleMessage.getScheduledDelay();
  if (delay !== null) {
    newProducibleMsg.setScheduledDelay(delay);
  }
  const repeatPeriod = producibleMessage.getScheduledRepeatPeriod();
  if (repeatPeriod !== null) {
    newProducibleMsg.setScheduledRepeatPeriod(repeatPeriod);
  }
  newProducibleMsg.setScheduledRepeat(producibleMessage.getScheduledRepeat());
  const exchange = producibleMessage.getExchange();
  if (exchange) {
    if (exchange.type === EExchangeType.DIRECT) {
      newProducibleMsg.setQueue(exchange.params);
    } else if (exchange.type === EExchangeType.TOPIC) {
      newProducibleMsg.setTopic(exchange.params);
    } else if (exchange.type === EExchangeType.FANOUT) {
      newProducibleMsg.setFanOut(exchange.params);
    }
  }

  const newEnvelope = new MessageEnvelope(newProducibleMsg);

  // Handle MessageState cloning or resetting
  if (resetState) {
    // Create a completely new state with a new ID
    newEnvelope.setMessageState(new MessageState());
  } else {
    // Clone the existing state using the built-in factory method.
    const newMsgState = MessageState.fromJSON(
      sourceEnvelope.getMessageState().toJSON(),
    );
    newEnvelope.setMessageState(newMsgState);
  }

  // Handle status resetting or copying
  if (resetStatus) {
    newEnvelope.setStatus(EMessagePropertyStatus.NEW);
  } else {
    newEnvelope.setStatus(sourceEnvelope.getStatus());
  }

  // Copy other envelope properties
  newEnvelope.setDestinationQueue(sourceEnvelope.getDestinationQueue());
  const consumerGroupId = sourceEnvelope.getConsumerGroupId();
  if (consumerGroupId) {
    newEnvelope.setConsumerGroupId(consumerGroupId);
  }

  return newEnvelope;
}
