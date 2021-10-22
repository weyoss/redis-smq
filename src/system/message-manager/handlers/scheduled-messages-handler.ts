import { RedisClient } from '../../redis-client';
import { Message } from '../../../message';
import { EMessageMetadata, EQueueMetadata, ICallback } from '../../../../types';
import { ELuaScriptName, getScriptId } from '../lua-scripts';
import { metadata } from '../../metadata';
import { redisKeys } from '../../redis-keys';
import * as async from 'async';
import { Scheduler } from '../../scheduler';
import { LockManager } from '../../lock-manager';

export class ScheduledMessagesHandler {
  protected getScriptId(withPriority: boolean): string {
    if (withPriority)
      return getScriptId(
        ELuaScriptName.ENQUEUE_SCHEDULED_MESSAGE_WITH_PRIORITY,
      );
    return getScriptId(ELuaScriptName.ENQUEUE_SCHEDULED_MESSAGE);
  }

  protected getDstQueue(queueName: string, withPriority: boolean): string {
    const { keyQueue, keyQueuePriority } = redisKeys.getKeys(queueName);
    if (withPriority) return keyQueuePriority;
    return keyQueue;
  }

  protected getDstQueueMetadataProperty(withPriority: boolean): EQueueMetadata {
    if (withPriority) return EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY;
    return EQueueMetadata.PENDING_MESSAGES;
  }

  protected getScheduledMessagesToTimestamp(
    redisClient: RedisClient,
    queueName: string,
    timestamp: number,
    cb: ICallback<Message[]>,
  ): void {
    const { keyQueueScheduledMessages } = redisKeys.getKeys(queueName);
    redisClient.zrangebyscore(
      keyQueueScheduledMessages,
      0,
      timestamp,
      (err, reply) => {
        if (err) cb(err);
        else {
          const messages = (reply ?? []).map((i) =>
            Message.createFromMessage(i),
          );
          cb(null, messages);
        }
      },
    );
  }

  protected enqueue(
    scheduler: Scheduler,
    redisClient: RedisClient,
    queueName: string,
    message: Message,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    metadata.getLastMessageMetadataItem(
      redisClient,
      message.getId(),
      [
        EMessageMetadata.SCHEDULED,
        EMessageMetadata.DELETED_FROM_SCHEDULED_QUEUE,
        EMessageMetadata.UNACKNOWLEDGED,
      ],
      (err, metadataItem) => {
        if (err) cb(err);
        else if (!metadataItem) cb(new Error('Expected a non empty reply'));
        else if (
          metadataItem.type === EMessageMetadata.DELETED_FROM_SCHEDULED_QUEUE
        ) {
          cb();
        } else {
          //
          const { keyMetadataQueue, keyQueueScheduledMessages } =
            redisKeys.getKeys(queueName);
          const { keyMetadataMessage } = redisKeys.getMessageKeys(
            message.getId(),
          );

          //
          const newState = Message.createFromMessage(message);
          if (scheduler.isPeriodic(newState)) newState.reset();

          const nextScheduleTimestamp =
            scheduler.getNextScheduledTimestamp(newState);
          if (withPriority) newState.getSetPriority(undefined);

          const enqueuedMetadata = metadata.getEnqueuedMessageMetadata(
            newState,
            withPriority,
          );
          redisClient.evalsha(
            this.getScriptId(withPriority),
            [
              11,
              keyQueueScheduledMessages,
              this.getDstQueue(queueName, withPriority),
              JSON.stringify(message),
              JSON.stringify(newState),
              enqueuedMetadata.state.getPriority() ?? '-1',
              keyMetadataMessage,
              JSON.stringify(enqueuedMetadata),
              keyMetadataQueue,
              EQueueMetadata.SCHEDULED_MESSAGES,
              this.getDstQueueMetadataProperty(withPriority),
              nextScheduleTimestamp || '-1',
            ],
            (err) => cb(err),
          );
        }
      },
    );
  }

  schedule(
    redisClient: RedisClient,
    queueName: string,
    message: Message,
    timestamp: number,
    cb: ICallback<void>,
  ): void {
    const { keyQueueScheduledMessages, keyMetadataQueue } =
      redisKeys.getKeys(queueName);
    const { keyMetadataMessage } = redisKeys.getMessageKeys(message.getId());
    redisClient.evalsha(
      getScriptId(ELuaScriptName.SCHEDULE_MESSAGE),
      [
        7,
        keyQueueScheduledMessages,
        JSON.stringify(message),
        timestamp,
        keyMetadataMessage,
        JSON.stringify(metadata.getScheduledMessageMetadata(message)),
        keyMetadataQueue,
        EQueueMetadata.SCHEDULED_MESSAGES,
      ],
      (err, reply) => {
        if (err) cb(err);
        else if (!reply || reply !== 'OK') cb(new Error('An error occurred'));
        else cb();
      },
    );
  }

  enqueueScheduledMessages(
    redisClient: RedisClient,
    scheduler: Scheduler,
    queueName: string,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    const { keyLockScheduler } = redisKeys.getKeys(queueName);
    const lockManager = new LockManager(redisClient);
    const enqueue = (messages: string[], cb: ICallback<void>) => {
      if (messages.length) {
        async.each<string, Error>(
          messages,
          (msg, done) => {
            const message = Message.createFromMessage(msg);
            this.enqueue(
              scheduler,
              redisClient,
              queueName,
              message,
              withPriority,
              (err) => {
                if (err) done(err);
                else done();
              },
            );
          },
          cb,
        );
      } else cb();
    };
    const fetch = (cb: ICallback<Message[]>) => {
      this.getScheduledMessagesToTimestamp(
        redisClient,
        queueName,
        Date.now(),
        cb,
      );
    };
    const cleanup = (cb: ICallback<void>) => {
      lockManager.releaseLock(cb);
    };
    lockManager.acquireLock(keyLockScheduler, 10000, false, (err, acquired) => {
      if (err) cb(err);
      else if (acquired)
        async.waterfall([fetch, enqueue, cleanup], (err) => cb(err));
      else cleanup(cb);
    });
  }
}
