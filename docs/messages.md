[RedisSMQ](../README.md) / [Docs](README.md) / Messages

# Messages

[`ProducibleMessage`](api/classes/ProducibleMessage.md) class is responsible for carrying application data, sometimes referred to as `message payload`, which may be delivered to a consumer to be processed asynchronously.

The message payload can be of any valid JSON data type. It may be a simple text message like `Hello world` or a complex data type like `{hello: 'world'}`.

```javascript
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage();
msg.setBody({hello: 'world'})
   .setTTL(3600000)
   .setRetryThreshold(5);
```

The `ProducibleMessage` class provides many methods for setting up different delivery/consumption parameters such as message priority, message TTL, retry threshold, etc.

See:

- [ProducibleMessage Class](api/classes/ProducibleMessage.md) - To set up various message parameters
- [Message Class](api/classes/Message.md) - To fetch/delete a message or a list of messages
- [QueueMessages](docs/api/classes/QueueMessages.md) - To browse all queue messages
- [QueuePendingMessages](docs/api/classes/QueuePendingMessages.md) - To browse queue pending messages
- [QueueAcknowledgedMessages](docs/api/classes/QueueAcknowledgedMessages.md) - To browse/requeue/delete queue acknowledged messages
- [QueueDeadLetteredMessages](docs/api/classes/QueueDeadLetteredMessages.md) - To browse/requeue/delete queue dead-lettered messages
- [QueueScheduledMessages](docs/api/classes/QueueScheduledMessages.md) - To browse/delete queue scheduled messages
