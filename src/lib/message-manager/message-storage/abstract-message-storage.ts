import { IRequiredConfig, TGetMessagesReply } from '../../../../types';
import { Message } from '../../message/message';
import { RedisClient, errors } from 'redis-smq-common';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export abstract class AbstractMessageStorage<
  KeyParams extends { keyMessages: string },
  IdParams extends { messageId: string },
> {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;
  protected config: IRequiredConfig;

  constructor(
    config: IRequiredConfig,
    redisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    this.redisClient = redisClient;
    this.logger = logger;
    this.config = config;
  }

  protected validatePaginationParams(skip: number, take: number): void {
    if (skip < 0 || take < 1) {
      throw new errors.ArgumentError(
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

  protected abstract countMessages(key: KeyParams, cb: ICallback<number>): void;
}
