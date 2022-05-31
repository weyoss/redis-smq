# Migrating from RedisSMQ v6 to v7

> Before upgrading, you should make a backup or finish processing your messages in case you have if you any important data.

The main breaking changes that has been made are:

## Queues are no longer automatically created at the time when a consumer or a producer is launched. 

Queues can be now created using the `QueueManager` before publishing or consuming a message. When creating a queue, priority queuing can be enabled or disabled.
  
This new way does not allow anymore a queue to be, in some cases, at the same time a priority queue and a Lifo queue.

See [QueueManager.prototype.queue.create()](/docs/api/queue-manager.md#queuemanagerprototypequeuecreate).

## Updated producer.produce() callback signature

When producing a message, if the message could not be produced an error will be returned. Removed the second parameter of the callback function.

Before:

```javascript
producer.produce(msg, (err, status) => {
  if (err) console.log(err);
  else if (!status) console.log('Not published');
  else console.log('Successfully published')
})
```

Now:

```javascript
producer.produce(msg, (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced');
})
```

## Updated consumer.consume() method signature

When registering a message handler, the `consumer.consume()` method is now accepting 3 arguments: queue, messageHandler, and a callback. The callback function now has a single argument (err).

Before

```javascript
consumer.consume(queue, priorityQueuing, messageHandler, (err, status) => {
  //
})
```

Now:

```javascript
consumer.consume(queue, messageHandler, (err) => {
  //
})
```

## Removed "storeMessages" entry from the configuration object and introduced the "messages" entry. 

Before:

```javascript
const config = {
  message: {
    consumeTimeout: 60000,
    retryThreshold: 5,
    retryDelay: 60000,
    ttl: 120000,
  },
  storeMessages: false,
}
```

Now:

```javascript
const config = {
  messages: {
    store: false,
  },
}
```

See [Configuration Reference](/docs/configuration.md) for more details.

## Removed "message" entry from the configuration object and replaced by Message.setDefaultConsumeOptions() method.

Before:

```javascript
const config = {
  message: {
    consumeTimeout: 60000,
    retryThreshold: 5,
    retryDelay: 60000,
    ttl: 120000,
  },
}
```

Now:

```javascript
const { Message } = require('redis-smq');

Message.setDefaultConsumeOptions({
  consumeTimeout: 60000,
  retryThreshold: 5,
  retryDelay: 60000,
  ttl: 120000,
})
```

## Removed the Web UI and all related files and components from the redis-smq package

The Web UI has been completely from the `redis-smq` package, and now it is a standalone application.

See [https://github.com/weyoss/redis-smq-monitor](https://github.com/weyoss/redis-smq-monitor).

## Refactored and improved different APIs, mainly QueueManager API and MessageManager API.

See [MessageManager API](/docs/api/message-manager.md) and [QueueManager API](/docs/api/queue-manager.md).