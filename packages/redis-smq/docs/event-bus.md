[RedisSMQ](../README.md) / [Docs](README.md) / EventBus

# EventBus

The RedisSMQ EventBus enables your applications to subscribe to various system events using a Publish-Subscribe
(PubSub) architecture.

By default, most events in RedisSMQ are not published to the EventBus. To utilize the EventBus, you must first enable
it in your [RedisSMQ Configuration](configuration.md).

For detailed information, refer to the [EventBus API](api/classes/EventBus.md).

## Supported EventBus Events

RedisSMQ supports several events that you can subscribe to:

- [TConsumerEvent](api/type-aliases/TConsumerEvent.md)
- [TConsumerHeartbeatEvent](api/type-aliases/TConsumerHeartbeatEvent.md)
- [TConsumerMessageHandlerRunnerEvent](api/type-aliases/TConsumerMessageHandlerRunnerEvent.md)
- [TConsumerMessageHandlerEvent](api/type-aliases/TConsumerMessageHandlerEvent.md)
- [TConsumerConsumeMessageEvent](api/type-aliases/TConsumerConsumeMessageEvent.md)
- [TConsumerDequeueMessageEvent](api/type-aliases/TConsumerDequeueMessageEvent.md)
- [TProducerEvent](api/type-aliases/TProducerEvent.md)
- [TQueueEvent](api/type-aliases/TQueueEvent.md)

## Usage

### Configuration

To enable the EventBus, add the following configuration:

```typescript
const { Configuration } = require('redis-smq');

const config = {
  eventBus: {
    enabled: true,
  },
};

Configuration.getSetConfig(config);
```

For more details on configuration, see [RedisSMQ Configuration](configuration.md).

### Creating an EventBus Instance

To create an instance of the EventBus, use the following code:

```typescript
import { EventBus } from 'redis-smq';

EventBus.getSetInstance((err, eventBus) => {
  if (err) {
    console.error('Failed to create EventBus instance:', err);
  } else {
    console.log('EventBus instance created successfully');
    // You can now use the eventBus instance
  }
});
```

### Subscribing to Events

The example below demonstrates how to subscribe to
a [TConsumerConsumeMessageEvent](api/type-aliases/TConsumerConsumeMessageEvent.md):

```javascript
eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  (messageId, queue, messageHandlerId, consumerId) => {
    console.log(
      `Message acknowledged: ${messageId} from queue: ${queue} handled by: ${messageHandlerId}, consumed by: ${consumerId}`,
    );
    // Add your event handling logic here
  },
);
```

### Shutting Down the EventBus Instance

To properly shut down the EventBus instance, call the shutDown method:

```javascript
EventBus.shutDown((err) => {
  if (err) {
    console.error('Error shutting down EventBus:', err);
  } else {
    console.log('EventBus shut down successfully');
  }
});
```

By following these steps, you can effectively integrate the RedisSMQ EventBus into your applications, allowing for
streamlined event handling and improved communication between system components.
