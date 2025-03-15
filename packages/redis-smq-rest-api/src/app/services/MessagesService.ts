/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Message, Producer, ProducibleMessage } from 'redis-smq';

const { promisifyAll } = bluebird;

export class MessagesService {
  protected message;
  protected producer;

  constructor(message: Message, producer: Producer) {
    this.message = promisifyAll(message);
    this.producer = promisifyAll(producer);
  }

  async getMessagesByIds(messageIds: string[]) {
    return this.message.getMessagesByIdsAsync(messageIds);
  }

  async getMessageById(messageId: string) {
    return this.message.getMessageByIdAsync(messageId);
  }

  async requeueMessageById(messageId: string) {
    return this.message.requeueMessageByIdAsync(messageId);
  }

  async deleteMessageById(messageId: string) {
    return this.message.deleteMessageByIdAsync(messageId);
  }

  async deleteMessagesByIds(messageIds: string[]) {
    return this.message.deleteMessagesByIdsAsync(messageIds);
  }

  async getMessageStatus(messageId: string) {
    return this.message.getMessageStatusAsync(messageId);
  }

  async publishMessage(message: ProducibleMessage) {
    await this.producer.runAsync();
    return this.producer.produceAsync(message);
  }
}
