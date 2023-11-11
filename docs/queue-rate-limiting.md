[RedisSMQ](../README.md) / [Docs](README.md) / Queue Rate limiting

# Queue Rate limiting

In some cases consuming messages with a high message rate may be not desirable. For example:

- A high rate of message consumption may create some problems for your application.
- Your application is consuming messages with a high rate, however a high level of resources is being used which affects the overall performance of your system.
- Your application is using an external API which is rate-limiting client requests and consuming messages with a high rate could make your service banned for a certain time or maybe permanently.
- Etc.

RedisSMQ allows you, in such cases, to control the rate at which the messages are consumed by setting a rate limit for a given queue.

To configure and view rate limiting parameters for a queue, the [QueueRateLimit](api/classes/QueueRateLimit.md) provides the following methods:

- [QueueRateLimit.prototype.set()](api/classes/QueueRateLimit.md#set)
- [QueueRateLimit.prototype.clear()](api/classes/QueueRateLimit.md#clear)
- [QueueRateLimit.prototype.get()](api/classes/QueueRateLimit.md#get)

**Example**

```javascript
const { QueueRateLimit } = require('redis-smq');

const queueRateLimit = new QueueRateLimit(config);
// Setting a rate limit of 200 msg/min for the 'notofications' queue
queueRateLimit.set('notifications', { limit: 200, interval: 60000 }, (err) => {
  // ...
})
```

Queue rate limiting parameters can be also configured using the [HTTP API Interface](https://github.com/weyoss/redis-smq-monitor) or from your browser with the help of the [Web UI](https://github.com/weyoss/redis-smq-monitor-client).