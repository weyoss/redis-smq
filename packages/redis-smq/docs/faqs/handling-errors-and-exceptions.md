[RedisSMQ](../README.md) / [Docs](README.md) / [FAQs](README.md) / How do I handle errors and exceptions when using RedisSMQ's classes and methods?

# How do I handle errors and exceptions when using RedisSMQ's classes and methods?

RedisSMQ exposes a callback-based API. Proper error handling spans initialization, producing, consuming, and shutdown. 
This guide shows recommended patterns using the RedisSMQ class, factory-created components, the errors namespace, and the optional EventBus.

## 1) Callback-based error handling

Most public methods follow Node-style callbacks: (err, result) => void. Always check the error first.

Example: initialize, start a producer, and produce a message

```javascript
'use strict';

import { RedisSMQ, ProducibleMessage, errors } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// 1) Initialize once per process
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (initErr) => {
    if (initErr) {
      console.error('RedisSMQ initialization failed:', initErr);
      return;
    }

    // 2) Create and start a producer
    const producer = RedisSMQ.createProducer();
    producer.run((runErr) => {
      if (runErr) {
        console.error('Producer failed to start:', runErr);
        return;
      }

      // Direct queue publishing (fastest path)
      const msg = new ProducibleMessage()
        .setQueue('my_queue')
        .setBody({ data: 'example' });

      // 3) Produce and handle errors
      producer.produce(msg, (produceErr, messageIds) => {
        if (produceErr) {
          if (produceErr instanceof errors.QueueNotFoundError) {
            console.error('Queue does not exist:', produceErr.message);
          } else {
            console.error('Failed to produce message:', produceErr);
          }
          return;
        }
        console.log('Message produced with IDs:', messageIds);
      });
    });
  },
);
```

## 2) Event-based error handling

Components emit error events. Listen for 'error' to centralize alerting/metrics. You can add listeners before or after
`run(...)`.

```javascript
'use strict';

import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initialize(
  { client: ERedisConfigClient.IOREDIS, options: { host: '127.0.0.1', port: 6379 } },
  (initErr) => {
    if (initErr) return console.error('Init failed:', initErr);

    const consumer = RedisSMQ.createConsumer();

    consumer.on('error', (err) => {
      // Centralize logging/metrics/alerts for runtime errors
      console.error('Consumer error event:', err);
    });

    consumer.consume(
      'my_queue',
      (message, done) => {
        try {
          // Your message handling logic...
          done(); // acknowledge success
        } catch (e) {
          done(e); // acknowledge failure so retries can occur
        }
      },
      (consumeErr) => {
        if (consumeErr) return console.error('Failed to register handler:', consumeErr);

        consumer.run((runErr) => {
          if (runErr) console.error('Consumer failed to start:', runErr);
          else console.log('Consumer is running');
        });
      },
    );
  },
);
```

_Tip_
- Wrap business logic in try/catch and call done(error) on failure so the message can be retried according to your
  configuration.

## 3) Handling specific error types

All error classes are exported under the `errors` namespace.

```javascript
'use strict';

import { RedisSMQ, ProducibleMessage, errors } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initialize(
  { client: ERedisConfigClient.IOREDIS, options: { host: '127.0.0.1', port: 6379 } },
  (initErr) => {
    if (initErr) return console.error('Init failed:', initErr);

    const producer = RedisSMQ.createProducer();
    producer.run((runErr) => {
      if (runErr) return console.error('Producer start failed:', runErr);

      const message = new ProducibleMessage()
        .setQueue('non_existent_queue')
        .setBody({ data: 'example' });

      producer.produce(message, (err) => {
        if (err) {
          if (err instanceof errors.QueueNotFoundError) {
            console.error('The specified queue does not exist:', err.message);
            // e.g., create the queue or route to a fallback
          } else {
            console.error('Produce failed:', err);
          }
          return;
        }
        console.log('Produced successfully');
      });
    });
  },
);
```

## 4) Logging

Enable RedisSMQ internal logging via configuration, and use your application logger consistently in callbacks and handlers.

Enable logging during initialization (persisted configuration):

```javascript
'use strict';

import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common';

RedisSMQ.initializeWithConfig(
  {
    namespace: 'my_app_dev',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port: 6379 },
    },
    logger: {
      enabled: true,
      options: { logLevel: EConsoleLoggerLevel.INFO },
    },
    messages: { store: false },
    eventBus: { enabled: false },
  },
  (err) => {
    if (err) console.error('Init with config failed:', err);
  },
);
```

Use your app logger in callbacks/handlers:

```javascript
producer.produce(msg, (err) => {
  if (err) appLogger.error('Produce failed', { err, queue: 'my_queue' });
});

consumer.on('error', (err) => appLogger.error('Consumer error', { err }));
```

## 5) Error events via EventBus (optional)

Other error events can be consumed from the EventBus. This is useful for centralized observability across producers, consumers, queues, and internals.

- Enable EventBus before initialization (recommended when you need to collect events):
    - With persisted config: set `eventBus: { enabled: true }` in `RedisSMQ.initializeWithConfig(...)`
- After initialization completes, get the singleton and subscribe to events.
- The `TRedisSMQEvent` type alias includes all possible EventBus event names. Consult the API reference for the full list.

Example (ESM):

```typescript
import { RedisSMQ, EventBus } from 'redis-smq';
import type { TRedisSMQEvent } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// Initialize with EventBus enabled (persisted configuration)
RedisSMQ.initializeWithConfig(
  {
    namespace: 'my_app',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port: 6379 },
    },
    logger: { enabled: false },
    messages: { store: false },
    eventBus: { enabled: true }, // Enable EventBus
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    const eventBus = EventBus.getInstance();

    // Subscribe to specific events; TRedisSMQEvent includes all supported names
    const eventsToWatch: TRedisSMQEvent[] = [
      // Choose relevant error events from the API reference, for example:
      // 'consumer.consumeMessage.error',
      // 'producer.error',
      // 'queue.error',
    ];

    eventsToWatch.forEach((name) => {
      eventBus.on(name, (...args: unknown[]) => {
        // args schema depends on the event; see API reference for payload shapes
        console.error('[EventBus]', name, ...args);
      });
    });

    // You can also subscribe to non-error events if needed (acks, bindings, etc.)
  },
);
```

Notes:
- Event names and payloads are strongly typed by `TRedisSMQEvent`. See API:
    - EventBus class: `api/classes/EventBus.md`
    - All events union: `api/type-aliases/TRedisSMQEvent.md`
- If EventBus is enabled via configuration and you create components through `RedisSMQ`, a single `RedisSMQ.shutdown(cb)` will stop EventBus and close shared resources for you.
