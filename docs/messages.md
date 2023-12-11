[RedisSMQ](../README.md) / [Docs](README.md) / Messages

# Messages

`MessageEnvelope` class is responsible for carrying application data, sometimes referred to as `message payload`, which may be delivered to a consumer to be processed asynchronously.

The message payload can be of any valid JSON data type. It may be a simple text message like `Hello world` or a complex data type like `{hello: 'world'}`.

```javascript
const { MessageEnvelope } = require('redis-smq');

const msg = new MessageEnvelope();
msg.setBody({hello: 'world'})
   .setTTL(3600000)
   .setRetryThreshold(5);
```

The `MessageEnvelope` class provides many methods for setting up different delivery/consumption parameters such as message priority, message TTL, retry threshold, etc.

See [Message Class](api/classes/Message.md) and [MessageEnvelope Class](api/classes/MessageEnvelope.md) for more details.
