import {
  ICallback,
  ICompatibleLogger,
  TGetMessagesReply,
  TGetPendingMessagesWithPriorityReply,
  TGetScheduledMessagesReply,
  TQueueParams,
} from '../../../types';
import { RedisClient } from '../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { queueManager } from '../queue-manager/queue-manager';
import { redisKeys } from '../common/redis-keys/redis-keys';
import {
  deleteListMessageAtSequenceId,
  getPaginatedListMessages,
  getPaginatedSortedSetMessages,
  getSortedSetSize,
  requeueListMessage,
} from './common';
import { MessageNotFoundError } from './errors/message-not-found.error';
import { LockManager } from '../common/lock-manager/lock-manager';
import { setConfigurationIfNotExists } from '../common/configuration';
import { getNamespacedLogger } from '../common/logger';

export class MessageManager {
  private static instance: MessageManager | null = null;
  private redisClient: RedisClient;
  private logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger('MessageManager');
  }

  ///

  deleteScheduledMessage(messageId: string, cb: ICallback<void>): void {
    const {
      keyScheduledMessageIds,
      keyScheduledMessages,
      keyLockDeleteScheduledMessage,
    } = redisKeys.getMainKeys();
    LockManager.lockFN(
      this.redisClient,
      keyLockDeleteScheduledMessage,
      (cb) => {
        // Not checking message existence.
        // If the message exists it will be deleted.
        // Otherwise, assuming that it has been already deleted
        const multi = this.redisClient.multi();
        multi.hdel(keyScheduledMessages, messageId);
        multi.zrem(keyScheduledMessageIds, messageId);
        this.redisClient.execMulti(multi, (err) => {
          if (err) cb(err);
          else {
            this.logger.info(
              `Scheduled message (ID ${messageId}) has been deleted`,
            );
            cb();
          }
        });
      },
      cb,
    );
  }

  deleteDeadLetteredMessage(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueueDL, keyLockDeleteDeadLetteredMessage } =
      redisKeys.getQueueKeys(queueParams.name, queueParams.ns);
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteDeadLetteredMessage,
      keyQueueDL,
      sequenceId,
      messageId,
      queueParams,
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Dead-lettered message (ID ${messageId}) has been deleted`,
          );
          cb();
        }
      },
    );
  }

  deleteAcknowledgedMessage(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueueAcknowledged, keyLockDeleteAcknowledgedMessage } =
      redisKeys.getQueueKeys(queueParams.name, queueParams.ns);
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteAcknowledgedMessage,
      keyQueueAcknowledged,
      sequenceId,
      messageId,
      queueParams,
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Acknowledged message (ID ${messageId}) has been deleted`,
          );
          cb();
        }
      },
    );
  }

  deletePendingMessage(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueuePending, keyLockDeletePendingMessage } =
      redisKeys.getQueueKeys(queueParams.name, queueParams.ns);
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeletePendingMessage,
      keyQueuePending,
      sequenceId,
      messageId,
      queueParams,
      (err) => {
        // In case the message does not exist
        // we assume it was delivered or already deleted
        const error = err instanceof MessageNotFoundError ? null : err;
        if (error) cb(error);
        else {
          this.logger.info(
            `Pending message (ID ${messageId}) has been deleted`,
          );
          cb();
        }
      },
    );
  }

  deletePendingMessageWithPriority(
    queue: string | TQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
      keyLockDeletePendingMessageWithPriority,
    } = redisKeys.getQueueKeys(queueParams.name, queueParams.ns);
    LockManager.lockFN(
      this.redisClient,
      keyLockDeletePendingMessageWithPriority,
      (cb) => {
        // Not verifying if the message exists.
        // In case the message does not exist we assume it was delivered or already deleted
        const multi = this.redisClient.multi();
        multi.hdel(keyQueuePendingPriorityMessages, messageId);
        multi.zrem(keyQueuePendingPriorityMessageIds, messageId);
        this.redisClient.execMulti(multi, (err) => {
          if (err) cb(err);
          else {
            this.logger.info(
              `Pending message with priority (ID ${messageId}) has been deleted`,
            );
            cb();
          }
        });
      },
      cb,
    );
  }

  ///

  requeueDeadLetteredMessage(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueueDL } = redisKeys.getQueueKeys(
      queueParams.name,
      queueParams.ns,
    );
    requeueListMessage(
      this.redisClient,
      queueParams,
      keyQueueDL,
      sequenceId,
      messageId,
      priority,
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Dead-lettered message (ID ${messageId}) has been re-queued`,
          );
          cb();
        }
      },
    );
  }

  requeueAcknowledgedMessage(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(
      queueParams.name,
      queueParams.ns,
    );
    requeueListMessage(
      this.redisClient,
      queueParams,
      keyQueueAcknowledged,
      sequenceId,
      messageId,
      priority,
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Acknowledged message (ID ${messageId}) has been re-queued`,
          );
          cb();
        }
      },
    );
  }

  ///

  purgeDeadLetteredMessages(
    queue: string | TQueueParams,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueueDL } = redisKeys.getQueueKeys(
      queueParams.name,
      queueParams.ns,
    );
    this.redisClient.del(keyQueueDL, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Queue (${JSON.stringify(
            queue,
          )}) dead-lettered messages have been deleted`,
        );
        cb();
      }
    });
  }

  purgeAcknowledgedMessages(
    queue: string | TQueueParams,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(
      queueParams.name,
      queueParams.ns,
    );
    this.redisClient.del(keyQueueAcknowledged, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Queue (${JSON.stringify(
            queue,
          )}) acknowledged messages have been deleted`,
        );
        cb();
      }
    });
  }

  purgePendingMessages(
    queue: string | TQueueParams,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueuePending } = redisKeys.getQueueKeys(
      queueParams.name,
      queueParams.ns,
    );
    this.redisClient.del(keyQueuePending, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Queue (${JSON.stringify(queue)}) pending messages have been deleted`,
        );
        cb();
      }
    });
  }

  purgePendingMessagesWithPriority(
    queue: string | TQueueParams,
    cb: ICallback<void>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queueParams.name, queueParams.ns);
    const multi = this.redisClient.multi();
    multi.del(keyQueuePendingPriorityMessages);
    multi.del(keyQueuePendingPriorityMessageIds);
    this.redisClient.execMulti(multi, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Queue (${JSON.stringify(
            queue,
          )}) pending messages with priority have been deleted`,
        );
        cb();
      }
    });
  }

  purgeScheduledMessages(cb: ICallback<void>): void {
    const { keyScheduledMessageIds, keyScheduledMessages } =
      redisKeys.getMainKeys();
    const multi = this.redisClient.multi();
    multi.del(keyScheduledMessages);
    multi.del(keyScheduledMessageIds);
    this.redisClient.execMulti(multi, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(`Scheduled messages have been deleted`);
        cb();
      }
    });
  }

  ///

  getAcknowledgedMessages(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(
      queueParams.name,
      queueParams.ns,
    );
    getPaginatedListMessages(
      this.redisClient,
      keyQueueAcknowledged,
      skip,
      take,
      cb,
    );
  }

  getDeadLetteredMessages(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueueDL } = redisKeys.getQueueKeys(
      queueParams.name,
      queueParams.ns,
    );
    getPaginatedListMessages(this.redisClient, keyQueueDL, skip, take, cb);
  }

  getPendingMessages(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const { keyQueuePending } = redisKeys.getQueueKeys(
      queueParams.name,
      queueParams.ns,
    );
    getPaginatedListMessages(this.redisClient, keyQueuePending, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queueParams.name, queueParams.ns);
    getPaginatedSortedSetMessages(
      this.redisClient,
      keyQueuePendingPriorityMessages,
      keyQueuePendingPriorityMessageIds,
      skip,
      take,
      cb,
    );
  }

  getScheduledMessages(
    skip: number,
    take: number,
    cb: ICallback<TGetScheduledMessagesReply>,
  ): void {
    const { keyScheduledMessageIds, keyScheduledMessages } =
      redisKeys.getMainKeys();
    getPaginatedSortedSetMessages(
      this.redisClient,
      keyScheduledMessages,
      keyScheduledMessageIds,
      skip,
      take,
      cb,
    );
  }

  ///

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(() => {
      if (MessageManager.instance === this) {
        MessageManager.instance = null;
      }
      cb();
    });
  }

  ///

  static getScheduledMessagesCount(
    redisClient: RedisClient,
    cb: ICallback<number>,
  ): void {
    const { keyScheduledMessageIds } = redisKeys.getMainKeys();
    getSortedSetSize(redisClient, keyScheduledMessageIds, cb);
  }

  static getSingletonInstance(cb: ICallback<MessageManager>): void {
    if (!MessageManager.instance) {
      setConfigurationIfNotExists();
      RedisClient.getNewInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new EmptyCallbackReplyError());
        else {
          const instance = new MessageManager(client);
          MessageManager.instance = instance;
          cb(null, instance);
        }
      });
    } else cb(null, MessageManager.instance);
  }
}
