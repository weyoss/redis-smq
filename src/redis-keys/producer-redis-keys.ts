import { MQRedisKeys } from './mq-redis-keys';

export class ProducerRedisKeys extends MQRedisKeys {
  /**
   * Keeping type values unchanged for compatibility with previous versions (<= 2.x.x)
   * In the next major release type values will be refactored.
   */
  static readonly types = {
    KEY_TYPE_PRODUCER_RATE_INPUT: '4.1',
  };

  protected instanceId: string;

  constructor(queueName: string, instanceId: string) {
    super(queueName);
    this.instanceId = instanceId;
  }

  getKeys() {
    const parentKeys = super.getKeys();
    const globalKeys = ProducerRedisKeys.getGlobalKeys();
    const keys = {
      keyProducerRateInput: ProducerRedisKeys.joinSegments(
        ProducerRedisKeys.types.KEY_TYPE_PRODUCER_RATE_INPUT,
        this.queueName,
        this.instanceId,
      ),
    };
    return {
      ...parentKeys,
      ...globalKeys,
      ...ProducerRedisKeys.makeNamespacedKeys(keys),
    };
  }

  static extractData(key: string) {
    const { ns, segments } = ProducerRedisKeys.getSegments(key);
    if (segments[0] === ProducerRedisKeys.types.KEY_TYPE_PRODUCER_RATE_INPUT) {
      const [type, queueName, producerId] = segments;
      return {
        ns,
        type,
        queueName,
        producerId,
      };
    }
    return null;
  }
}
