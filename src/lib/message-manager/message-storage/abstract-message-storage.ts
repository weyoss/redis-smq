import {
  ICallback,
  ICompatibleLogger,
  TGetMessagesReply,
} from '../../../../types';
import { RedisClient } from '../../../common/redis-client/redis-client';
import { ArgumentError } from '../../../common/errors/argument.error';
import { getNamespacedLogger } from '../../../common/logger';
import { Message } from '../../message/message';

export abstract class AbstractMessageStorage<
  KeyParams extends { keyMessages: string },
  IdParams extends { messageId: string },
> {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger(this.constructor.name);
  }

  protected validatePaginationParams(skip: number, take: number): void {
    if (skip < 0 || take < 1) {
      throw new ArgumentError(
        `Parameter [skip] should be >= 0. Parameter [take] should be >= 1.`,
      );
    }
  }

  protected abstract getMessageById(
    key: KeyParams,
    id: IdParams,
    cb: ICallback<Message>,
  ): void;

  protected abstract deleteMessage(
    key: KeyParams,
    id: IdParams,
    cb: ICallback<void>,
  ): void;

  protected abstract fetchMessages(
    key: KeyParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void;

  protected abstract purgeMessages(key: KeyParams, cb: ICallback<void>): void;
}
