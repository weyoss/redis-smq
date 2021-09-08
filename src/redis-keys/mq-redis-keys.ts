const globalNamespace = '___redis-smq-global-ns';
let namespace = 'redis-smq-default-ns';

export class MQRedisKeys {
  /**
   * Keeping type values unchanged for compatibility with previous versions (<= 2.x.x).
   * In the next major release type values will be refactored.
   */
  static readonly types: Record<string, string> = {
    KEY_TYPE_QUEUE: '1.1',
    KEY_TYPE_QUEUE_DLQ: '1.3',
    KEY_TYPE_QUEUE_DELAYED_QUEUE: '1.4',
    KEY_TYPE_LOCK_SCHEDULER: '7.1',
    KEY_TYPE_INDEX_RATE: '4',
    KEY_TYPE_INDEX_QUEUE: '6.1',
    KEY_TYPE_INDEX_QUEUE_DLQ: '6.3',
    KEY_TYPE_LOCK_STATS_AGGREGATOR: '5.1',
  };

  protected queueName: string;

  constructor(queueName: string) {
    this.queueName = queueName;
  }

  getKeys() {
    const globalKeys = MQRedisKeys.getGlobalKeys();
    const keys = {
      keyQueue: MQRedisKeys.joinSegments(
        MQRedisKeys.types.KEY_TYPE_QUEUE,
        this.queueName,
      ),
      keyQueueDLQ: MQRedisKeys.joinSegments(
        MQRedisKeys.types.KEY_TYPE_QUEUE_DLQ,
        this.queueName,
      ),
      keyQueueDelayed: MQRedisKeys.joinSegments(
        MQRedisKeys.types.KEY_TYPE_QUEUE_DELAYED_QUEUE,
        this.queueName,
      ),
      keyLockScheduler: MQRedisKeys.joinSegments(
        MQRedisKeys.types.KEY_TYPE_LOCK_SCHEDULER,
        this.queueName,
      ),
    };
    return {
      ...globalKeys,
      ...MQRedisKeys.makeNamespacedKeys(keys),
    };
  }

  static extractData(key: string) {
    const { ns, segments } = MQRedisKeys.getSegments(key);
    if (
      segments[0] === MQRedisKeys.types.KEY_TYPE_QUEUE ||
      segments[0] === MQRedisKeys.types.KEY_TYPE_QUEUE_DELAYED_QUEUE ||
      segments[0] === MQRedisKeys.types.KEY_TYPE_QUEUE_DLQ ||
      segments[0] === MQRedisKeys.types.KEY_TYPE_LOCK_SCHEDULER
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

  static getSegments(key: string) {
    const [ns, ...segments] = key.split('|');
    segments[0] = segments[0].replace(/[@]/g, '');
    return {
      ns,
      segments,
    };
  }

  static getGlobalKeys() {
    const keys = {
      keyIndexQueue: MQRedisKeys.types.KEY_TYPE_INDEX_QUEUE,
      keyIndexQueueDLQ: MQRedisKeys.types.KEY_TYPE_INDEX_QUEUE_DLQ,
      keyIndexRate: MQRedisKeys.types.KEY_TYPE_INDEX_RATE,
      keyLockStatsAggregator: MQRedisKeys.types.KEY_TYPE_LOCK_STATS_AGGREGATOR,
    };
    return MQRedisKeys.makeGlobalNamespacedKeys(keys);
  }

  static joinSegments(...segments: string[]) {
    return segments.join('|');
  }

  static makeGlobalNamespacedKeys<T extends Record<string, string>>(
    keys: T,
  ): Record<Extract<keyof T, string>, string> {
    const result: Record<string, string> = {};
    for (const k in keys) {
      result[k] = MQRedisKeys.joinSegments(globalNamespace, `@${keys[k]}`);
    }
    return result;
  }

  static makeNamespacedKeys<T extends Record<string, string>>(
    keys: T,
  ): Record<Extract<keyof T, string>, string> {
    const result: Record<string, string> = {};
    for (const k in keys) {
      result[k] = MQRedisKeys.joinSegments(namespace, `@${keys[k]}`);
    }
    return result;
  }

  static setNamespace(ns: string) {
    ns = MQRedisKeys.validateRedisKey(ns);
    namespace = `redis-smq-${ns}`;
  }

  static validateRedisKey(key: string) {
    if (!key || !key.length) {
      throw new Error(
        'Redis key validation error. Expected be a non empty string.',
      );
    }
    const filtered = key.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (filtered.length !== key.length) {
      throw new Error(
        'Redis key validation error. Expected only letters (a-z), numbers (0-9) and (-_)',
      );
    }
    return filtered;
  }
}
