[RedisSMQ](../README.md) / [Docs](README.md) / EventBus

# EventBus

The RedisSMQ EventBus lets your application subscribe to internal system events via a Publish-Subscribe (PubSub)
mechanism.

- Disabled by default.
- Enable it in your configuration before initialization.
- When using the RedisSMQ class and EventBus is enabled, RedisSMQ will start and manage the EventBus for you.

For the full API, see the EventBus API and event type definitions:

- EventBus class: [API Reference](api/classes/EventBus.md)
- Events:
  - [TConsumerEvent](api/type-aliases/TConsumerEvent.md)
  - [TConsumerHeartbeatEvent](api/type-aliases/TConsumerHeartbeatEvent.md)
  - [TConsumerMessageHandlerRunnerEvent](api/type-aliases/TConsumerMessageHandlerRunnerEvent.md)
  - [TConsumerMessageHandlerEvent](api/type-aliases/TConsumerMessageHandlerEvent.md)
  - [TConsumerConsumeMessageEvent](api/type-aliases/TConsumerConsumeMessageEvent.md)
  - [TConsumerDequeueMessageEvent](api/type-aliases/TConsumerDequeueMessageEvent.md)
  - [TProducerEvent](api/type-aliases/TProducerEvent.md)
  - [TQueueEvent](api/type-aliases/TQueueEvent.md)

## Enabling the EventBus

Enable EventBus when initializing with a full RedisSMQ configuration:

```typescript
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
    eventBus: { enabled: true }, // Enable EventBus
  },
  (err) => {
    if (err) return console.error('Initialization failed:', err);
    console.log('RedisSMQ initialized with EventBus enabled');
  },
);
```

Notes:

- Enabling EventBus after initialization via configuration updates will persist the setting, but the EventBus will be
  started automatically only during initialization. Prefer enabling it before calling
  `RedisSMQ.initialize/initializeWithConfig`.

## Getting the EventBus instance

When EventBus is enabled, retrieve the singleton instance and subscribe to events. No callback is needed.

```typescript
import { EventBus } from 'redis-smq';

// Succeeds after RedisSMQ.initialize*(...) has completed
const eventBus = EventBus.getInstance();
```

## Subscribing to events

Subscribe using the event names defined by the type aliases above.

Example: subscribe to a consumer message acknowledgment event:

```typescript
import { EventBus } from 'redis-smq';

const eventBus = EventBus.getInstance();

eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  (messageId, queue, messageHandlerId, consumerId) => {
    console.log(
      `Message acknowledged: ${messageId} from queue: ${queue.name} handled by: ${messageHandlerId}, consumer: ${consumerId}`,
    );
  },
);
```

You may subscribe to any supported event (consumer lifecycle, producer lifecycle, queue changes, heartbeats,
message flow, etc.) using the event names listed in the API links above.

## Shutdown

- If components were created via the `RedisSMQ` class (recommended), prefer calling `RedisSMQ.shutdown(cb)`. It will
  close shared infrastructure and the EventBus automatically when enabled; you do not need to shut down EventBus
  separately.
- If you explicitly need to stop the EventBus (for example, outside of a full RedisSMQ shutdown), call:

```typescript
import { EventBus } from 'redis-smq';

EventBus.shutdown((err) => {
  if (err) console.error('EventBus shutdown error:', err);
  else console.log('EventBus shut down');
});
```

## Troubleshooting

- Ensure RedisSMQ has been initialized before accessing EventBus:
  - Call `RedisSMQ.initialize(...)` or `RedisSMQ.initializeWithConfig(...)` at startup.
  - Access EventBus via `EventBus.getInstance()` after initialization completes.
- No events received:
  - Confirm `eventBus.enabled` is true in the configuration you initialized with.
  - Verify you are subscribing to correct event names (see API type alias pages).
- Graceful shutdown:
  - Prefer a single `RedisSMQ.shutdown(cb)` call to close all tracked components and the EventBus at application exit.

By enabling the EventBus and subscribing to the desired channels, you can observe internal activity across producers,
consumers, and queues with minimal code.
