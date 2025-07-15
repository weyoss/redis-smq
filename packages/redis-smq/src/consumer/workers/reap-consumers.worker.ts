/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback } from 'redis-smq-common';
import { _getQueueConsumerIds } from '../../queue/_/_get-queue-consumer-ids.js';
import { ConsumerHeartbeat } from '../consumer-heartbeat/consumer-heartbeat.js';
import { MessageUnacknowledgement } from '../message-handler/consume-message/message-unacknowledgement.js';
import {
  EMessageUnacknowledgementReason,
  IConsumerMessageHandlerWorkerPayload,
} from '../types/index.js';
import { Worker } from './worker.js';

class ReapConsumersWorker extends Worker {
  protected messageUnacknowledgement: MessageUnacknowledgement;

  constructor(args: IConsumerMessageHandlerWorkerPayload) {
    super(args);
    this.messageUnacknowledgement = new MessageUnacknowledgement(
      this.redisClient,
    );
  }

  work = (cb: ICallback<void>): void => {
    this.logger.debug('Starting watch consumers work cycle');

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error('Failed to get Redis client instance', redisClient);
      cb(redisClient);
      return void 0;
    }

    const queueName = this.queueParsedParams.queueParams.name;
    const queueNamespace = this.queueParsedParams.queueParams.ns;
    this.logger.debug(
      `Checking consumers for queue: ${queueNamespace}:${queueName}`,
    );

    _getQueueConsumerIds(
      redisClient,
      this.queueParsedParams.queueParams,
      (err, consumerIds) => {
        if (err) {
          this.logger.error(
            `Error retrieving consumer IDs for queue ${queueNamespace}:${queueName}`,
            err,
          );
          cb(err);
        } else {
          const consumerCount = consumerIds?.length || 0;
          this.logger.debug(
            `Found ${consumerCount} consumers for queue ${queueNamespace}:${queueName}`,
          );

          async.eachOf(
            consumerIds ?? [],
            (consumerId, index, done) => {
              this.logger.debug(
                `Checking heartbeat for consumer ${consumerId} (${index + 1}/${consumerCount})`,
              );

              ConsumerHeartbeat.isConsumerAlive(
                redisClient,
                consumerId,
                (err, alive) => {
                  if (err) {
                    this.logger.error(
                      `Error checking heartbeat for consumer ${consumerId}`,
                      err,
                    );
                    done(err);
                  } else if (!alive) {
                    this.logger.info(
                      `Consumer ${consumerId} is offline, unacknowledging messages`,
                    );
                    this.messageUnacknowledgement.unacknowledgeMessagesInProcess(
                      consumerId,
                      [this.queueParsedParams.queueParams],
                      EMessageUnacknowledgementReason.OFFLINE_CONSUMER,
                      (err, status) => {
                        if (err) {
                          this.logger.error(
                            `Failed to unacknowledge messages for offline consumer ${consumerId}`,
                            err,
                          );
                          done(err);
                        } else {
                          const messageCount = status
                            ? Object.keys(status).length
                            : 0;
                          this.logger.info(
                            `Successfully unacknowledged ${messageCount} messages for offline consumer ${consumerId}`,
                          );
                          done();
                        }
                      },
                    );
                  } else {
                    this.logger.debug(
                      `Consumer ${consumerId} is alive and active`,
                    );
                    done();
                  }
                },
              );
            },
            (err) => {
              if (err) {
                this.logger.error(
                  'Error during consumer heartbeat check cycle',
                  err,
                );
              } else {
                this.logger.debug(
                  'Completed watch consumers work cycle successfully',
                );
              }
              cb(err);
            },
          );
        }
      },
    );
  };
}

export default (payload: IConsumerMessageHandlerWorkerPayload) =>
  new ReapConsumersWorker(payload);
