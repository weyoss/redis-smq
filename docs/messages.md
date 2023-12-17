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

For more details see:

- [ProducibleMessage Class](api/classes/ProducibleMessage.md)
- [Message Class](api/classes/Message.md)
