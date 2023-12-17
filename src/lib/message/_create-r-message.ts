/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from './message-envelope';
import {
  EMessagePriority,
  EMessagePropertyStatus,
  IMessageSerialized,
  IConsumableMessage,
  IQueueParams,
  TExchange,
  TTopicParams,
} from '../../../types';

export function _createRMessage(msg: MessageEnvelope): IConsumableMessage {
  return {
    getPublishedAt(): number | null {
      return msg.getPublishedAt();
    },

    getScheduledAt(): number | null {
      return msg.getScheduledAt();
    },

    getScheduledMessageId(): string | null {
      return msg.getScheduledMessageId();
    },

    getId(): string {
      return msg.getId();
    },

    getStatus(): EMessagePropertyStatus {
      return msg.getStatus();
    },

    hasPriority(): boolean {
      return msg.producibleMessage.hasPriority();
    },

    getQueue(): IQueueParams | string | null {
      return msg.producibleMessage.getQueue();
    },

    getDestinationQueue(): IQueueParams {
      return msg.getDestinationQueue();
    },

    getPriority(): EMessagePriority | null {
      return msg.producibleMessage.getPriority();
    },

    getBody(): unknown {
      return msg.producibleMessage.getBody();
    },

    getTTL(): number {
      return msg.producibleMessage.getTTL();
    },

    getRetryThreshold(): number {
      return msg.producibleMessage.getRetryThreshold();
    },

    getRetryDelay(): number {
      return msg.producibleMessage.getRetryDelay();
    },

    getConsumeTimeout(): number {
      return msg.producibleMessage.getConsumeTimeout();
    },

    getCreatedAt(): number {
      return msg.producibleMessage.getCreatedAt();
    },

    getScheduledRepeat(): number {
      return msg.producibleMessage.getScheduledRepeat();
    },

    getScheduledRepeatPeriod(): number | null {
      return msg.producibleMessage.getScheduledRepeatPeriod();
    },

    getScheduledCRON(): string | null {
      return msg.producibleMessage.getScheduledCRON();
    },

    getScheduledDelay(): number | null {
      return msg.producibleMessage.getScheduledDelay();
    },

    getFanOut(): string | null {
      return msg.producibleMessage.getFanOut();
    },

    getTopic(): TTopicParams | string | null {
      return msg.producibleMessage.getTopic();
    },

    toJSON(): IMessageSerialized {
      return msg.toJSON();
    },

    getExchange(): TExchange {
      return msg.getExchange();
    },
  };
}
