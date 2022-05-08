import { MessagesService } from './messages.service';
import { QueuesService } from './queues.service';
import { ConsumerTimeSeriesService } from './consumer-time-series.service';
import { QueueTimeSeriesService } from './queue-time-series.service';
import { GlobalTimeSeriesService } from './global-time-series.service';
import { QueueManager } from '../../queue-manager';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { PanicError } from '../../system/common/errors/panic.error';

let redisClient: RedisClient | null = null;
let messagesService: MessagesService | null = null;
let queuesService: QueuesService | null = null;
let consumerTimeSeriesService: ConsumerTimeSeriesService | null = null;
let queueTimeSeriesService: QueueTimeSeriesService | null = null;
let globalTimeSeriesService: GlobalTimeSeriesService | null = null;

function getRedisClient(): RedisClient {
  if (!redisClient) {
    throw new PanicError(
      `Redis client instance is required. Please initialize services first.`,
    );
  }
  return redisClient;
}

export function initServices(client: RedisClient) {
  redisClient = client;
}

export function messagesServiceInstance() {
  if (!messagesService) {
    const redisClient = getRedisClient();
    messagesService = new MessagesService(redisClient);
  }
  return messagesService;
}

export function queuesServiceInstance() {
  if (!queuesService) {
    const redisClient = getRedisClient();
    const queueManager = new QueueManager(redisClient);
    queuesService = new QueuesService(queueManager);
  }
  return queuesService;
}

export function consumerTimeSeriesServiceInstance() {
  if (!consumerTimeSeriesService) {
    const redisClient = getRedisClient();
    consumerTimeSeriesService = new ConsumerTimeSeriesService(redisClient);
  }
  return consumerTimeSeriesService;
}

export function queueTimeSeriesServiceInstance() {
  if (!queueTimeSeriesService) {
    const redisClient = getRedisClient();
    queueTimeSeriesService = new QueueTimeSeriesService(redisClient);
  }
  return queueTimeSeriesService;
}

export function globalTimeSeriesServiceInstance() {
  if (!globalTimeSeriesService) {
    const redisClient = getRedisClient();
    globalTimeSeriesService = new GlobalTimeSeriesService(redisClient);
  }
  return globalTimeSeriesService;
}
