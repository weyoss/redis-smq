/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { MessageManager, Producer, ProducibleMessage } from 'redis-smq';

const { promisifyAll } = bluebird;

export class MessagesService {
  protected messageManager;
  protected producer;

  constructor(messageManager: MessageManager, producer: Producer) {
    this.messageManager = promisifyAll(messageManager);
    this.producer = promisifyAll(producer);
  }

  async getMessagesByIds(messageIds: string[]) {
    return this.messageManager.getMessagesByIdsAsync(messageIds);
  }

  async getMessageById(messageId: string) {
    return this.messageManager.getMessageByIdAsync(messageId);
  }

  async requeueMessageById(messageId: string) {
    return this.messageManager.requeueMessageByIdAsync(messageId);
  }

  async deleteMessageById(messageId: string) {
    return this.messageManager.deleteMessageByIdAsync(messageId);
  }

  async deleteMessagesByIds(messageIds: string[]) {
    return this.messageManager.deleteMessagesByIdsAsync(messageIds);
  }

  async getMessageStatus(messageId: string) {
    return this.messageManager.getMessageStatusAsync(messageId);
  }

  async publishMessage(message: ProducibleMessage) {
    await this.producer.runAsync();
    return this.producer.produceAsync(message);
  }
}
