import { RedisClient } from '../../redis-client/redis-client';

export abstract class Handler {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }
}
