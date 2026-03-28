/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback } from 'redis-smq-common';
import { _getQueueConsumerIds } from '../../../../queue-manager/_/_get-queue-consumer-ids.js';
import { MessageUnacknowledger } from '../../consume-message/message-unacknowledger.js';
import { EMessageUnacknowledgementCause } from '../../consume-message/types/index.js';
import { withSharedPoolConnection } from '../../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _deleteEphemeralConsumerGroup } from '../../_/_delete-ephemeral-consumer-group.js';
import { QueueWorkerAbstract } from '../queue-worker-abstract.js';
import { _isConsumerAlive } from '../../../_/_is-consumer-alive.js';
import { Consumer } from '../../../consumer.js';
import { _unsubscribeConsumer } from '../../_/_unsubscribe-consumer.js';

export class ReapConsumersWorker extends QueueWorkerAbstract {
  /**
   * Creates a MessageUnacknowledger instance for a specific consumer.
   * The reaper uses non-batch mode since it's dealing with offline consumers.
   */
  protected createMessageUnacknowledger(
    consumerId: string,
  ): MessageUnacknowledger {
    const unacknowledger = new MessageUnacknowledger(
      consumerId,
      this.queueParsedParams,
      this.logger,
      Consumer.getDefaultOptions(),
    );

    unacknowledger.on('messageUnacknowledger.error', (err) => {
      this.logger.error(
        `MessageUnacknowledger error for consumer ${consumerId}:`,
        err,
      );
    });

    unacknowledger.on(
      'messageUnacknowledger.messagesUnacknowledged',
      (status) => {
        const messageCount = Object.keys(status).length;
        if (messageCount > 0) {
          this.logger.info(
            `Unacknowledged ${messageCount} messages for consumer ${consumerId}`,
          );
        }
      },
    );

    return unacknowledger;
  }

  /**
   * Recovers a single offline consumer.
   */
  protected recoverConsumer(
    consumerId: string,
    unacknowledger: MessageUnacknowledger,
    cb: ICallback,
  ): void {
    const queue = this.queueParsedParams.queueParams;
    const queueRef = `${queue.name}@${queue.ns}`;

    async.series(
      [
        // Step 1: Start the unacknowledger
        (done: ICallback) => {
          this.logger.debug(
            `Starting unacknowledger for consumer ${consumerId}`,
          );
          unacknowledger.run(done);
        },

        // Step 2: Unacknowledge all messages in the queue
        (done: ICallback) => {
          this.logger.debug(
            `Unacknowledging messages for consumer ${consumerId} on queue ${queueRef}`,
          );

          unacknowledger.unacknowledgeProcessingQueue(
            EMessageUnacknowledgementCause.OFFLINE_CONSUMER,
            (err, status) => {
              if (err) {
                this.logger.error(
                  `Failed to unacknowledge messages for consumer ${consumerId}: ${err.message}`,
                );
                return done(); // Continue with recovery
              }

              const count = status ? Object.keys(status).length : 0;
              if (count > 0) {
                this.logger.info(
                  `Unacknowledged ${count} messages for consumer ${consumerId}`,
                );
              }
              done();
            },
          );
        },

        // Step 3: Clean up ephemeral consumer groups
        (done: ICallback) => {
          this.logger.debug(
            `Cleaning up ephemeral groups for consumer ${consumerId}`,
          );

          _deleteEphemeralConsumerGroup(queue, consumerId, null, (err) => {
            if (err) {
              this.logger.warn(
                `Failed to delete ephemeral group for ${queueRef}, consumer ${consumerId}: ${err.message}`,
              );
            } else {
              this.logger.debug(
                `Ephemeral group deleted for ${queueRef}, consumer ${consumerId}`,
              );
            }
            done();
          });
        },

        // Step 4: Unsubscribe consumer from queue
        (done: ICallback) => {
          _unsubscribeConsumer(consumerId, this.queueParsedParams, (err) => {
            if (err) {
              const queue = this.queueParsedParams.queueParams;
              this.logger.error(
                `Failed to unsubscribe consumer ${consumerId} from queue ${queue.name}@${queue.ns}: ${err.message}`,
              );
            }
            done(err); // pass the error so the next time we try again
          });
        },
      ],
      (err) => {
        this.logger.debug(
          `Shutting down unacknowledger for consumer ${consumerId}`,
        );
        unacknowledger.shutdown(() => cb(err));
      },
    );
  }

  /**
   * Main work function that checks for offline consumers and triggers recovery.
   */
  work = (cb: ICallback<void>): void => {
    withSharedPoolConnection((redisClient, connCb) => {
      const queue = this.queueParsedParams.queueParams;
      const queueRef = `${queue.name}@${queue.ns}`;

      _getQueueConsumerIds(redisClient, queue, (err, consumerIds) => {
        if (err) {
          this.logger.error(
            `Failed to get consumer IDs for ${queueRef}: ${err.message}`,
          );
          return connCb(err);
        }

        const consumers = (consumerIds || []).filter(
          (i) => i !== this.consumerId,
        );
        if (consumers.length === 0) {
          return connCb();
        }

        this.logger.debug(
          `Found ${consumers.length} consumers for queue ${queueRef}`,
        );

        // Check each consumer's heartbeat
        async.eachOf(
          consumers,
          (consumerId, index, done) => {
            this.logger.debug(
              `[${index + 1}/${consumers.length}] Checking heartbeat for consumer ${consumerId}`,
            );

            _isConsumerAlive(redisClient, consumerId, (err, alive) => {
              if (err) {
                this.logger.error(
                  `Heartbeat check failed for ${consumerId}: ${err.message}`,
                );
                return done(err);
              }

              if (alive) {
                this.logger.debug(`Consumer ${consumerId} is alive`);
                return done();
              }

              // Consumer is offline - recover it
              this.logger.info(
                `Consumer ${consumerId} is offline, starting recovery`,
              );

              const unacknowledger =
                this.createMessageUnacknowledger(consumerId);

              this.recoverConsumer(
                consumerId,
                unacknowledger,
                (recoveryErr) => {
                  if (recoveryErr) {
                    this.logger.error(
                      `Recovery failed for consumer ${consumerId}: ${recoveryErr.message}`,
                    );
                  } else {
                    this.logger.info(
                      `Successfully recovered consumer ${consumerId}`,
                    );
                  }
                  done();
                },
              );
            });
          },
          connCb,
        );
      });
    }, cb);
  };
}

export default ReapConsumersWorker;
