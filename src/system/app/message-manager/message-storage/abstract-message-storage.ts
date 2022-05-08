import {
  ICallback,
  ICompatibleLogger,
  TPaginatedResponse,
} from '../../../../../types';
import { RedisClient } from '../../../common/redis-client/redis-client';
import { ArgumentError } from '../../../common/errors/argument.error';
import { getNamespacedLogger } from '../../../common/logger';

export abstract class AbstractMessageStorage<
  StorageParams,
  MessageItemParams,
  FetchMessagesReply,
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

  protected abstract deleteMessage(
    key: StorageParams,
    id: MessageItemParams,
    cb: ICallback<void>,
  ): void;

  protected abstract fetchMessages(
    key: StorageParams,
    skip: number,
    take: number,
    cb: ICallback<TPaginatedResponse<FetchMessagesReply>>,
  ): void;

  protected abstract purgeMessages(
    key: StorageParams,
    cb: ICallback<void>,
  ): void;
}
