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
import { ConsumerHeartbeat } from '../../../consumer-heartbeat/consumer-heartbeat.js';
import { MessageUnacknowledgement } from '../../consume-message/message-unacknowledgement.js';
import { EMessageUnacknowledgementReason } from '../../consume-message/types/index.js';
import { withSharedPoolConnection } from '../../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _deleteEphemeralConsumerGroup } from '../../_/_delete-ephemeral-consumer-group.js';
import { QueueWorkerAbstract } from '../queue-worker-abstract.js';
import { IQueueWorkerPayload } from '../../../../common/worker/types/message-handler-worker.js';

export class ReapConsumersWorker extends QueueWorkerAbstract {
  protected messageUnacknowledgement: MessageUnacknowledgement;

  constructor(payload: IQueueWorkerPayload) {
    super(payload);
    this.messageUnacknowledgement = new MessageUnacknowledgement(this.logger);
  }

  protected cleanUp(consumerId: string, cb: ICallback): void {
    async.series(
      [
        (done: ICallback) => {
          this.logger.info(`Unacknowledging messages...`);
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
                return done(err);
              }
              const messageCount = status ? Object.keys(status).length : 0;
              this.logger.info(
                `Successfully unacknowledged ${messageCount} messages for offline consumer ${consumerId}`,
              );
              done();
            },
          );
        },
        (done: ICallback) => {
          this.logger.info(`Cleaning up ephemeral consumer groups...`);
          _deleteEphemeralConsumerGroup(
            this.queueParsedParams.queueParams,
            consumerId,
            null,
            (err) => {
              const queue = this.queueParsedParams.queueParams;
              const queueRef = `${queue.name}@${queue.ns}`;
              if (err) {
                // Best-effort cleanup: do not fail the whole cycle, but log with full context
                this.logger.warn(
                  `Failed to delete ephemeral consumer group for ${queueRef}, consumer ${consumerId}`,
                  err,
                );
              } else {
                this.logger.debug(
                  `Ephemeral consumer group deleted for ${queueRef}, consumer ${consumerId}`,
                );
              }
              done();
            },
          );
        },
      ],
      (err) => cb(err),
    );
  }

  work = (cb: ICallback<void>): void => {
    this.logger.debug('Starting watch consumers work cycle');

    withSharedPoolConnection((redisClient, cb) => {
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
                        `Consumer ${consumerId} is offline, cleaning up...`,
                      );
                      this.cleanUp(consumerId, done);
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
    }, cb);
  };
}

export default ReapConsumersWorker;
