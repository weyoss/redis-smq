[RedisSMQ](../README.md) / [Docs](README.md) / Queue Rate Limiting

# Queue Rate Limiting

In certain scenarios, consuming messages at a high rate can be disadvantageous. Some potential issues include:

- **System Performance:** A high rate of message consumption may overwhelm your application, leading to performance
  degradation.
- **Resource Utilization:** Rapid message consumption can result in excessive resource usage, negatively impacting the
  overall performance of your system.
- **External API Restrictions:** If your application interacts with an external API that enforces rate limits on client
  requests, consuming messages too quickly could risk the suspension or permanent ban of your service.
- **Additional Considerations:** Various other factors may necessitate managing message consumption rates.

To address these challenges, RedisSMQ allows you to set and control the rate at which messages are consumed by
implementing a rate limit for a queue.

## Prerequisites

- Initialize RedisSMQ once per process before creating components:
  - `RedisSMQ.initialize(redisConfig, cb)`, or
  - `RedisSMQ.initializeWithConfig(redisSMQConfig, cb)`
- Create the rate-limiting component via the RedisSMQ factory:
  - `const queueRateLimit = RedisSMQ.createQueueRateLimit()`

## Quick example

Set a rate limit of 200 messages per minute for the notifications queue.

[RedisSMQ](../README.md) / [Docs](README.md) / Queue Rate Limiting

# Queue Rate Limiting

In certain scenarios, consuming messages at a high rate can be disadvantageous. Common issues include:

- System performance degradation when consumers overwhelm downstream services
- Excessive resource utilization
- External API client throttling or bans when exceeding provider rate limits
- Other environment-specific constraints

To address these challenges, RedisSMQ allows you to control the rate at which messages are consumed by applying a rate limit to a queue.

## Prerequisites

- Initialize RedisSMQ once per process before creating components:
  - RedisSMQ.initialize(redisConfig, cb), or
  - RedisSMQ.initializeWithConfig(redisSMQConfig, cb)
- Create the rate-limiting component via the RedisSMQ factory:
  - const queueRateLimit = RedisSMQ.createQueueRateLimit()
- When components are created via RedisSMQ factory methods, you typically do not need to shut them down individually. Prefer calling RedisSMQ.shutdown(cb) at application exit to close shared infrastructure and tracked components.

## Quick example

Set a rate limit of 200 messages per minute for the notifications queue.

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

// 1) Initialize once per process
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    // 2) Create the queue rate limit manager via RedisSMQ
    const queueRateLimit = RedisSMQ.createQueueRateLimit();

    // 3) Apply a limit: 200 messages per 60_000 ms
    queueRateLimit.set('notifications', { limit: 200, interval: 60000 }, (setErr) => {
      if (setErr) return console.error('Error setting rate limit:', setErr);
      console.log('Rate limit set successfully!');
    });

    // Optionally: verify current settings
    queueRateLimit.get('notifications', (getErr, params) => {
      if (getErr) return console.error('Error getting rate limit:', getErr);
      console.log('Current rate limit:', params);
    });

    // Preferred at app exit:
    // RedisSMQ.shutdown((e) => e && console.error('Shutdown error:', e));
  },
);
```

## API usage patterns

- Set a rate limit
```javascript
queueRateLimit.set('queue-name', { limit: 100, interval: 1000 }, cb);
```
Where:
- limit: number of messages
- interval: time window in milliseconds

- Get the current rate limit
```javascript
queueRateLimit.get('queue-name', (err, params) => {
  // params is null if no rate limit is set
});
```

- Clear a rate limit
  ```javascript
  queueRateLimit.clear('queue-name', (err) => {
    // removes any configured rate limit for the queue
  });
  ```

- Check whether a limit would be exceeded
  ```javascript
  queueRateLimit.hasExceeded(
    'queue-name',
    { limit: 100, interval: 1000 },
    (err, exceeded) => {
      if (err) return console.error(err);
      console.log('Exceeded?', exceeded);
    },
  );
  ```

Notes:
- You can pass a queue name string or a queue descriptor object (e.g., `{ ns: 'my_app', name: 'notifications' }`) wherever a queue is required.

## Behavior and considerations

- Rate limits control the throughput of message consumption per queue within the specified interval.
- If you change rate limits at runtime, consumers will reflect the updated constraints without needing a restart.
- Use per-environment namespaces to avoid collisions and to isolate rate limits between environments or applications.

## Shutdown

- If the `QueueRateLimit` instance was created via RedisSMQ factory methods, you typically do not need to shut it down 
individually. Prefer a single `RedisSMQ.shutdown(cb)` call at application exit.
- If you created `QueueRateLimit` outside of RedisSMQ (advanced usage), you may shut it down explicitly if the 
component exposes a shutdown method.

## See also

- QueueRateLimit class: [API Reference](api/classes/QueueRateLimit.md)
- Queues overview: [queues.md](queues.md)
- Consuming messages: [consuming-messages.md](consuming-messages.md)
```

