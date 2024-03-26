[RedisSMQ](../README.md) / [Docs](README.md) / Messages

# Messages

[`ProducibleMessage Class`](api/classes/ProducibleMessage.md) is responsible for carrying application data, sometimes referred to as `message payload`, which may be delivered to a consumer to be processed asynchronously.

The message payload can be of any valid JSON data type. It may be a simple text message like `Hello world` or a complex data type like `{hello: 'world'}`.

```javascript
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage();
msg.setBody({ hello: 'world' }).setTTL(3600000).setRetryThreshold(5);
```

The `ProducibleMessage` class provides many methods for setting up different delivery/consumption parameters such as message priority, message TTL, retry threshold, etc.

See:

- [ProducibleMessage Class](api/classes/ProducibleMessage.md) - To set up various message parameters before publishing it;
- [Message Class](api/classes/Message.md) - To fetch/delete a message or a list of messages from a queue;
- [QueueMessages Class](api/classes/QueueMessages.md) - To manage queue messages;
- [QueuePendingMessages Class](api/classes/QueuePendingMessages.md) - To manage queue pending messages
- [QueueAcknowledgedMessages Class](api/classes/QueueAcknowledgedMessages.md) - To manage queue acknowledged messages
- [QueueDeadLetteredMessages Class](api/classes/QueueDeadLetteredMessages.md) - To manage queue dead-lettered messages
- [QueueScheduledMessages Class](api/classes/QueueScheduledMessages.md) - To manage queue scheduled messages
