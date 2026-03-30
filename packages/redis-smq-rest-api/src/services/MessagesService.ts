/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageManager, Producer, ProducibleMessage } from 'redis-smq';

export class MessagesService {
  protected messageManager;
  protected producer;

  constructor(messageManager: MessageManager, producer: Producer) {
    this.messageManager = messageManager;
    this.producer = producer;
  }

  async getMessagesByIds(messageIds: string[]) {
    return this.messageManager.getMessagesByIds(messageIds);
  }

  async getMessageById(messageId: string) {
    return this.messageManager.getMessageById(messageId);
  }

  async requeueMessageById(messageId: string) {
    return this.messageManager.requeueMessageById(messageId);
  }

  async deleteMessageById(messageId: string) {
    return this.messageManager.deleteMessageById(messageId);
  }

  async deleteMessagesByIds(messageIds: string[]) {
    return this.messageManager.deleteMessagesByIds(messageIds);
  }

  async getMessageStatus(messageId: string) {
    return this.messageManager.getMessageStatus(messageId);
  }

  async getMessageUnacknowledgementHistory(messageId: string) {
    return this.messageManager.getMessageUnacknowledgementHistory(messageId);
  }

  async publishMessage(message: ProducibleMessage) {
    await this.producer.run();
    return this.producer.produce(message);
  }
}
