import { RedisClient } from '../../redis-client';
import { Message } from '../../../message';
import { EMessageMetadata, EQueueMetadata, ICallback } from '../../../../types';
import { metadata } from '../../metadata';
import { redisKeys } from '../../redis-keys';
import * as async from 'async';
import { Scheduler } from '../../scheduler';
import { LockManager } from '../../lock-manager';

export class ScheduledMessagesHandler {
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
          const { keyMetadataQueue, keyQueueScheduledMessages } =
            redisKeys.getKeys(queueName);
          const { keyMetadataMessage } = redisKeys.getMessageKeys(
            message.getId(),
          );
          const newState = Message.createFromMessage(message);
          if (scheduler.isPeriodic(newState)) newState.reset();
          const priority = withPriority
            ? newState.getSetPriority(undefined)
            : null;
          const nextScheduleTimestamp =
            scheduler.getNextScheduledTimestamp(newState);
          const enqueuedMetadata = metadata.getEnqueuedMessageMetadata(
            newState,
            withPriority,
          );
          //todo handle null reply
          redisClient.watch([keyQueueScheduledMessages], (err) => {
            if (err) cb(err);
            else {
              const dstQueue = this.getDstQueue(queueName, withPriority);
              const stateStr = JSON.stringify(message);
              const newStateStr = JSON.stringify(newState);
              const enqueuedMetadataStr = JSON.stringify(enqueuedMetadata);
              const multi = redisClient.multi();
              multi.zrem(keyQueueScheduledMessages, stateStr);
              if (typeof priority === 'number') {
                multi.zadd(dstQueue, priority, newStateStr);
              } else {
                multi.lpush(dstQueue, newStateStr);
              }
              multi.rpush(keyMetadataMessage, enqueuedMetadataStr);
              multi.hincrby(
                keyMetadataQueue,
                EQueueMetadata.SCHEDULED_MESSAGES,
                -1,
              );
              multi.hincrby(
                keyMetadataQueue,
                this.getDstQueueMetadataProperty(withPriority),
                1,
              );
              if (nextScheduleTimestamp) {
                multi.zadd(
                  keyQueueScheduledMessages,
                  nextScheduleTimestamp,
                  newStateStr,
                );
                multi.hincrby(
                  keyMetadataQueue,
                  EQueueMetadata.SCHEDULED_MESSAGES,
                  1,
                );
              }
              redisClient.execMulti(multi, (err) => {
                if (err) cb(err);
                else cb();
              });
            }
          });
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
    const multi = redisClient.multi();
    multi.zadd(keyQueueScheduledMessages, timestamp, JSON.stringify(message));
    multi.rpush(
      keyMetadataMessage,
      JSON.stringify(metadata.getScheduledMessageMetadata(message)),
    );
    multi.hincrby(keyMetadataQueue, EQueueMetadata.SCHEDULED_MESSAGES, 1);
    redisClient.execMulti(multi, (err) => cb(err));
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
