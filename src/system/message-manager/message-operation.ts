import {
  EMessageMetadataType,
  ICallback,
  IMessageMetadata,
} from '../../../types';
import { LockManager } from '../lock-manager';
import { redisKeys } from '../redis-keys';
import { metadata } from '../metadata';
import * as async from 'async';
import { RedisClient } from '../redis-client';

const lockTTL = 10000; // 10 seconds

export class MessageOperation {
  protected handleMessageOperation(
    redisClient: RedisClient,
    messageId: string,
    expectedLastMessageMetadata: EMessageMetadataType[],
    operation: (messageMetadata: IMessageMetadata, cb: ICallback<void>) => void,
    cb: ICallback<void>,
  ): void {
    const lockManager = new LockManager(redisClient);
    const { keyLockMessageManager } = redisKeys.getGlobalKeys();
    const acquireLock = (cb: ICallback<void>) => {
      lockManager.acquireLock(
        keyLockMessageManager,
        lockTTL,
        false,
        (err, isLocked) => {
          if (err) cb(err);
          else if (!isLocked)
            cb(
              new Error(
                `A lock could not be acquired. Retry again after ${
                  lockTTL / 1000
                } seconds.`,
              ),
            );
          else cb();
        },
      );
    };
    const getLastMetadata = (cb: ICallback<IMessageMetadata>) =>
      metadata.getLastMessageMetadata(redisClient, messageId, cb);
    const validateLastMetatadata = (
      messageMetadata: IMessageMetadata,
      cb: ICallback<IMessageMetadata>,
    ) => {
      if (!expectedLastMessageMetadata.includes(messageMetadata.type)) {
        cb(new Error('Message last metadata does not match expected ones'));
      } else cb(null, messageMetadata);
    };
    async.waterfall(
      [acquireLock, getLastMetadata, validateLastMetatadata, operation],
      (err) => {
        lockManager.quit(() => cb(err));
      },
    );
  }
}
