[RedisSMQ](../README.md) / [Docs](README.md) / EventBus

# EventBus

RedisSMQ EventBus allows your applications to subscribe to different system events in a PubSub style.

By default, most of RedisSMQ events are not published to the EventBus. To use the EventBus you need first to enable it from your [RedisSMQ Configuration](configuration.md).

See [EventBusRedisInstance API](api/classes/EventBusRedisInstance.md) for more details.

## EventBus Events

- [TConsumerEvent](api/README.md#tconsumerevent)
- [TConsumerHeartbeatEvent](api/README.md#tconsumerheartbeatevent)
- [TConsumerMessageHandlerRunnerEvent](api/README.md#tconsumermessagehandlerrunnerevent)
- [TConsumerMessageHandlerEvent](api/README.md#tconsumermessagehandlerevent)
- [TConsumerConsumeMessageEvent](api/README.md#tconsumerconsumemessageevent)
- [TConsumerDequeueMessageEvent](api/README.md#tconsumerdequeuemessageevent)
- [TProducerEvent](api/README.md#tproducerevent)
- [TQueueEvent](api/README.md#tqueueevent)

## Usage

### Configuration

```typescript
const { Configuration } = require('redis-smq');

const config = {
  eventBus: {
    enabled: true,
  }
}

Configuration.getSetConfig(config);
```

See [RedisSMQ Configuration](configuration.md) for more details.

### Creating an EventBus Instance

```typescript
import { EventBusRedisInstance } from 'redis-smq';

EventBusRedisInstance.getSetInstance((err, eventBus) => {
  //
});
```

### Subscribing to Events

In the example bellow we are going to subscribe to a [TConsumerConsumeMessageEvent](api/README.md#tconsumerconsumemessageevent) event.

```typescript
eventBus.on('consumer.consumeMessage.messageAcknowledged', (messageId, queue, messageHandlerId, consumerId) => {
  //...
})
```

### Shutting Down the Eventbus Instance

```typescript
EventBusRedisInstance.shutDown((err) => {
  //
});
```
