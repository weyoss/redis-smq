import { redisKeys } from '../common/redis-keys/redis-keys';
import {
  async,
  RedisClient,
  Worker,
  ICallback,
  CallbackEmptyReplyError,
} from 'redis-smq-common';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
  EQueueType,
} from '../../types';
import { ELuaScriptName } from '../common/redis-client/redis-client';
import { _getMessage } from '../lib/queue/queue-messages/_get-message';

export class RequeueUnacknowledgedWorker extends Worker {
  protected redisKeys: ReturnType<(typeof redisKeys)['getMainKeys']>;
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient, managed: boolean) {
    super(managed);
    this.redisClient = redisClient;
    this.redisKeys = redisKeys.getMainKeys();
  }

  work = (cb: ICallback<void>): void => {
    const { keyRequeueMessages } = this.redisKeys;
    this.redisClient.lrange(keyRequeueMessages, 0, 9, (err, reply) => {
      if (err) cb(err);
      else {
        const messageIds = reply ?? [];
        if (messageIds.length) {
          const keys: string[] = [keyRequeueMessages];
          const argv: (string | number)[] = [
            EQueueProperty.QUEUE_TYPE,
            EQueueType.PRIORITY_QUEUE,
            EQueueType.LIFO_QUEUE,
            EQueueType.FIFO_QUEUE,
            EMessageProperty.STATUS,
            EMessagePropertyStatus.PENDING,
            EMessageProperty.STATE,
          ];
          async.each(
            messageIds,
            (messageId, _, done) => {
              _getMessage(this.redisClient, messageId, (err, message) => {
                if (err) done(err);
                else if (!message) cb(new CallbackEmptyReplyError());
                else {
                  const messageId = message.getRequiredId();
                  const queue = message.getDestinationQueue();
                  const messageState = message.getRequiredMessageState();
                  const {
                    keyQueuePending,
                    keyPriorityQueuePending,
                    keyQueueProperties,
                  } = redisKeys.getQueueKeys(queue);
                  const { keyMessage } = redisKeys.getMessageKeys(messageId);
                  keys.push(
                    keyQueueProperties,
                    keyPriorityQueuePending,
                    keyQueuePending,
                    keyMessage,
                  );
                  messageState.incrAttempts();
                  const messagePriority = message.getPriority() ?? '';
                  argv.push(
                    messageId,
                    messagePriority,
                    JSON.stringify(messageState),
                  );
                  done();
                }
              });
            },
            (err) => {
              if (err) cb(err);
              else {
                this.redisClient.runScript(
                  ELuaScriptName.REQUEUE_MESSAGE,
                  keys,
                  argv,
                  (err) => cb(err),
                );
              }
            },
          );
        } else cb();
      }
    });
  };
}

export default RequeueUnacknowledgedWorker;
