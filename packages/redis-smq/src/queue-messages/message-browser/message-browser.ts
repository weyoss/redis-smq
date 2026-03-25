/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
} from 'redis-smq-common';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { IMessageTransferable } from '../../message/index.js';
import { _parseQueueExtendedParams } from '../../queue-manager/_/_parse-queue-extended-params.js';
import {
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../../queue-manager/index.js';
import { _validateQueueExtendedParams } from './_/_validate-queue-extended-params.js';
import { IBrowserPage, IMessageBrowser } from './types/index.js';
import { MessageManager } from '../../message-manager/index.js';
import { withSharedPoolConnection } from '../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { InvalidPurgeQueueJobIdError } from '../../errors/index.js';
import { IBrowserStorage } from './browser-storage/browser-storage-abstract.js';
import { EBackgroundJobStatus } from '../../common/index.js';
import { PurgeQueueJobManager } from '../../common/background-jobs/jobs/purge-queue/purge-queue-job-manager.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { _getMessageIds } from './_/_get-message-ids.js';
import { EQueueMessageType } from '../types/index.js';
import {
  TPurgeQueueJob,
  TPurgeQueueJobPayload,
} from '../../common/background-jobs/jobs/purge-queue/types/index.js';

/**
 * Provides a base implementation for browsing and managing messages within a
 * specific queue category (e.g., pending, acknowledged, dead-lettered).
 *
 * This abstract class encapsulates the common logic for counting messages,
 * fetching them in paginated sets, and purging them from the queue.
 * Subclasses are responsible for providing the specific Redis key and storage
 * strategy for the message category they represent.
 *
 * @abstract
 * @implements {IMessageBrowser}
 */
export class MessageBrowser implements IMessageBrowser {
  /**
   * Redis key for the message collection.
   * Subclasses must specify this to correctly target the underlying Redis key.
   */
  protected readonly redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>;
  /**
   * Logger instance for logging operations.
   */
  protected readonly logger: ILogger;

  /**
   * Flag indicating if a consumer group ID is required during validation.
   */
  protected requireGroupId: boolean;

  /**
   * Message manager for retrieving detailed message information.
   */
  protected readonly messageManager: MessageManager;

  /**
   * Storage implementation for the specific Redis data structure.
   */
  protected readonly messageStorage: IBrowserStorage;

  /**
   * Type of queue messages this browser handles.
   */
  public readonly messageType: EQueueMessageType;

  constructor(
    messageManager: MessageManager,
    messageStorage: IBrowserStorage,
    messageType: EQueueMessageType,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
    requireGroupId: boolean,
    logger: ILogger,
  ) {
    this.messageManager = messageManager;
    this.messageStorage = messageStorage;
    this.messageType = messageType;
    this.logger = logger;
    this.redisKey = redisKey;
    this.requireGroupId = requireGroupId;
  }

  /**
   * Validates if a purge operation is allowed on the queue
   */
  private validatePurgeOperation(
    parsedParams: IQueueParsedParams,
    cb: ICallback,
  ): void {
    withSharedPoolConnection((client, done) => {
      _validateOperation(
        client,
        parsedParams.queueParams,
        EQueueOperation.PURGE,
        done,
      );
    }, cb);
  }

  /**
   * Creates a purge job for the queue
   */
  private createPurgeJob(
    parsedParams: IQueueParsedParams,
    cb: ICallback<string>,
  ): void {
    this.withPurgeQueueJobManager((purgeQueueJobManager, done) => {
      const target: TPurgeQueueJobPayload = {
        queue: parsedParams,
        messageType: this.messageType,
      };

      purgeQueueJobManager.create(target, {}, (err, job) => {
        if (err) {
          this.logger.error(
            `Could not create purge job for queue ${parsedParams.queueParams.name}`,
            err,
          );
          done(err);
          return;
        }
        done(null, job?.id);
      });
    }, cb);
  }

  /**
   * Checks if a purge job belongs to the specified queue
   */
  private isJobForQueue(
    job: TPurgeQueueJob,
    parsedParams: IQueueParsedParams,
  ): boolean {
    return (
      job.payload.queue.queueParams.name === parsedParams.queueParams.name &&
      job.payload.queue.queueParams.ns === parsedParams.queueParams.ns &&
      job.payload.queue.groupId === parsedParams.groupId &&
      job.payload.messageType === this.messageType
    );
  }

  /**
   * Helper method to execute operations with validated queue parameters.
   * Encapsulates the common validation pattern used across multiple methods.
   */
  protected withValidatedQueue<T>(
    queue: TQueueExtendedParams,
    operation: (params: IQueueParsedParams, cb: ICallback<T>) => void,
    cb: ICallback<T>,
  ): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters: ${parsedParams.message}`,
      );
      cb(parsedParams);
      return;
    }

    withSharedPoolConnection((client, done) => {
      _validateQueueExtendedParams(
        client,
        parsedParams,
        this.requireGroupId,
        (err) => {
          if (err) {
            this.logger.error(
              `Error validating queue parameters: ${err.message}`,
            );
            done(err);
            return;
          }
          operation(parsedParams, done);
        },
      );
    }, cb);
  }

  /**
   * Helper method to get a purge queue job manager instance
   */
  protected withPurgeQueueJobManager<T>(
    operation: (
      purgeQueueJobManager: PurgeQueueJobManager,
      cb: ICallback<T>,
    ) => void,
    cb: ICallback<T>,
  ): void {
    withSharedPoolConnection((client, done) => {
      async.waterfall(
        [
          (next: ICallback<PurgeQueueJobManager>) => {
            const purgeQueueJobManager = new PurgeQueueJobManager(
              client,
              this.logger,
            );
            purgeQueueJobManager.initialize((err) => {
              if (err) {
                next(err);
                return;
              }
              next(null, purgeQueueJobManager);
            });
          },
          operation,
        ],
        done,
      );
    }, cb);
  }

  public purge(queue: TQueueExtendedParams, cb: ICallback<string>): void {
    this.logger.info(
      `Purging queue messages for queue ${JSON.stringify(queue)}`,
    );

    this.withValidatedQueue(
      queue,
      (parsedParams, done) => {
        // Step 1: Validate purge operation
        this.validatePurgeOperation(parsedParams, (err) => {
          if (err) {
            done(err);
            return;
          }

          // Step 2: Create purge job
          this.createPurgeJob(parsedParams, done);
        });
      },
      cb,
    );
  }

  public getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<TPurgeQueueJob>,
  ): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, done) => {
        this.withPurgeQueueJobManager((purgeQueueJobManager, innerDone) => {
          purgeQueueJobManager.get(jobId, (err, job) => {
            if (err) {
              innerDone(err);
              return;
            }

            if (!job) {
              innerDone(new CallbackEmptyReplyError());
              return;
            }

            // Verify this job belongs to this queue and message type
            if (!this.isJobForQueue(job, parsedParams)) {
              innerDone(
                new InvalidPurgeQueueJobIdError({
                  metadata: { jobId },
                }),
              );
              return;
            }

            innerDone(null, job);
          });
        }, done);
      },
      cb,
    );
  }

  public getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<EBackgroundJobStatus>,
  ): void {
    this.getPurgeJob(queue, jobId, (err, job) => {
      if (err) {
        cb(err);
        return;
      }
      if (!job) {
        cb(new CallbackEmptyReplyError());
        return;
      }
      cb(null, job.status);
    });
  }

  public cancelPurge(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback,
  ): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, done) => {
        this.withPurgeQueueJobManager((purgeQueueJobManager, innerDone) => {
          purgeQueueJobManager.get(jobId, (err, job) => {
            if (err) {
              innerDone(err);
              return;
            }

            if (!job || !this.isJobForQueue(job, parsedParams)) {
              innerDone(
                new InvalidPurgeQueueJobIdError({
                  metadata: { jobId },
                }),
              );
              return;
            }

            purgeQueueJobManager.cancel(jobId, (err) => innerDone(err));
          });
        }, done);
      },
      cb,
    );
  }

  public getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, done) => {
        this.logger.debug(
          `Getting messages for ${parsedParams.queueParams.name}, page ${page}, size ${pageSize}`,
        );

        async.waterfall(
          [
            (next: ICallback<IBrowserPage<string>>) => {
              _getMessageIds(
                parsedParams,
                page,
                pageSize,
                this.redisKey,
                this.messageStorage,
                this.logger,
                next,
              );
            },
            (
              pageResult: IBrowserPage<string>,
              next: ICallback<IBrowserPage<IMessageTransferable>>,
            ) => {
              if (pageResult.items.length === 0) {
                next(null, { ...pageResult, items: [] });
                return;
              }

              this.messageManager.getMessagesByIds(
                pageResult.items,
                (err, messages) => {
                  if (err) {
                    next(err);
                    return;
                  }
                  next(null, {
                    ...pageResult,
                    items: messages ?? [],
                  });
                },
              );
            },
          ],
          done,
        );
      },
      cb,
    );
  }

  public countMessages(
    queue: TQueueExtendedParams,
    cb: ICallback<number>,
  ): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, done) => {
        this.logger.debug(
          `Counting messages for ${parsedParams.queueParams.name}`,
        );

        const keys = redisKeys.getQueueKeys(
          parsedParams.queueParams.ns,
          parsedParams.queueParams.name,
          parsedParams.groupId,
        );
        const keyVal = keys[this.redisKey];

        this.messageStorage.count(keyVal, (err, count) => {
          if (err) {
            this.logger.error(`Error counting messages: ${err.message}`);
            done(err);
            return;
          }

          this.logger.debug(
            `Queue ${parsedParams.queueParams.name} has ${count} messages`,
          );
          done(null, count);
        });
      },
      cb,
    );
  }

  public getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<string>>,
  ): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, done) => {
        _getMessageIds(
          parsedParams,
          page,
          pageSize,
          this.redisKey,
          this.messageStorage,
          this.logger,
          done,
        );
      },
      cb,
    );
  }
}
