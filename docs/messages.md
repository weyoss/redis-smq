[RedisSMQ](../README.md) / [Docs](README.md) / Messages

# Messages

`Message` class is responsible for creating messages that may be published.

A message can carry your application data, sometimes referred to as `message payload`, which may be delivered to a consumer to be processed asynchronously.

The message payload can be of any valid JSON data type. It may be a simple text message like `Hello world` or a complex data type like `{hello: 'world'}`.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message
    .setBody({hello: 'world'})
    .setTTL(3600000)
    .setRetryThreshold(5);
```

The `Message` class provides many methods for setting up different message parameters such as message body, message priority, message TTL, etc.

See [Message Class](api/classes/Message.md) for more details.