import { MQRedisKeys } from './mq-redis-keys';

export class ConsumerRedisKeys extends MQRedisKeys {
  /**
   * Keeping type values unchanged for compatibility with previous versions (<= 2.x.x).
   * In the next major release type values will be refactored.
   */
  static readonly types = {
    KEY_TYPE_CONSUMER_RATE_PROCESSING: '4.2',
    KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED: '4.3',
    KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED: '4.4',
    KEY_TYPE_CONSUMER_HEARTBEAT: '4.5',
    KEY_TYPE_CONSUMER_PROCESSING_QUEUE: '1.2',
    KEY_TYPE_LOCK_GC: '3.1',
    KEY_TYPE_INDEX_QUEUE_QUEUES_PROCESSING: '6.4', // index of all processing queues of a given queue
    KEY_TYPE_INDEX_QUEUE_PROCESSING: '6.2', // index of all processing queues
    KEY_TYPE_INDEX_HEARTBEAT: '2.1',
    KEY_TYPE_LOCK_HEARTBEAT_MONITOR: '2.2',
  };

  protected instanceId: string;

  constructor(queueName: string, instanceId: string) {
    super(queueName);
    this.instanceId = instanceId;
  }

  getKeys() {
    const parentKeys = super.getKeys();
    const globalKeys = ConsumerRedisKeys.getGlobalKeys();
    const keys = {
      keyConsumerProcessingQueue: ConsumerRedisKeys.joinSegments(
        ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_PROCESSING_QUEUE,
        this.queueName,
        this.instanceId,
      ),
      keyConsumerRateUnacknowledged: ConsumerRedisKeys.joinSegments(
        ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED,
        this.queueName,
        this.instanceId,
      ),
      keyConsumerHeartBeat: ConsumerRedisKeys.joinSegments(
        ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_HEARTBEAT,
        this.queueName,
        this.instanceId,
      ),
      keyConsumerRateProcessing: ConsumerRedisKeys.joinSegments(
        ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_RATE_PROCESSING,
        this.queueName,
        this.instanceId,
      ),
      keyConsumerRateAcknowledged: ConsumerRedisKeys.joinSegments(
        ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED,
        this.queueName,
        this.instanceId,
      ),
      keyLockGC: ConsumerRedisKeys.joinSegments(
        ConsumerRedisKeys.types.KEY_TYPE_LOCK_GC,
        this.queueName,
      ),
      keyIndexQueueQueuesProcessing: ConsumerRedisKeys.joinSegments(
        ConsumerRedisKeys.types.KEY_TYPE_INDEX_QUEUE_QUEUES_PROCESSING,
        this.queueName,
      ),
    };
    return {
      ...parentKeys,
      ...globalKeys,
      ...ConsumerRedisKeys.makeNamespacedKeys(keys),
    };
  }

  static extractData(key: string) {
    const { ns, segments } = ConsumerRedisKeys.getSegments(key);
    if (
      segments[0] ===
        ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_PROCESSING_QUEUE ||
      segments[0] ===
        ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_RATE_PROCESSING ||
      segments[0] ===
        ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED ||
      segments[0] ===
        ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED ||
      segments[0] === ConsumerRedisKeys.types.KEY_TYPE_CONSUMER_HEARTBEAT
    ) {
      const [type, queueName, consumerId] = segments;
      return {
        ns,
        queueName,
        type,
        consumerId,
      };
    }
    if (
      segments[0] === ConsumerRedisKeys.types.KEY_TYPE_LOCK_GC ||
      segments[0] ===
        ConsumerRedisKeys.types.KEY_TYPE_INDEX_QUEUE_QUEUES_PROCESSING
    ) {
      const [type, queueName] = segments;
      return {
        ns,
        type,
        queueName,
      };
    }
    return null;
  }

  static getGlobalKeys() {
    const parentKeys = MQRedisKeys.getGlobalKeys();
    const keys = {
      keyIndexHeartBeat: ConsumerRedisKeys.types.KEY_TYPE_INDEX_HEARTBEAT,
      keyLockHeartBeatMonitor:
        ConsumerRedisKeys.types.KEY_TYPE_LOCK_HEARTBEAT_MONITOR,
      keyIndexQueueProcessing:
        ConsumerRedisKeys.types.KEY_TYPE_INDEX_QUEUE_PROCESSING,
    };
    return {
      ...parentKeys,
      ...ConsumerRedisKeys.makeGlobalNamespacedKeys(keys),
    };
  }
}
