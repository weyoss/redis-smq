# Migrating from RedisSMQ v6.x.x to v7.x.x

> Before upgrading, you should make a backup or finish processing your messages in case you have if you any important data.

The main breaking changes that has been made are:

- Queues are no longer automatically created at the time when a consumer or a producer is launched. Queues can be now 
  created using the `QueueManager` before publishing or consuming a message. When creating a queue, priority queuing 
  can be enabled or disabled.
  
  This new way does not allow anymore a queue to be, in some cases, at the same time a priority queue and a Lifo queue.

- When producing a message, if the message could not be produced an error will be returned. Removed the second parameter
  of the callback function.

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

- When registering a message handler, the `consumer.consume()` method is now accepting 3 arguments: queue, messageHandler, and a callback.

Before

```javascript
consumer.consume(queue, priorityQueuing, messageHandler, (err, status) => {
  //
})
```

Now:

```javascript
consumer.consume(queue, messageHandler, (err, status) => {
  //
})
```

- Refactored and improved different APIs, mainly QueueManager API and MessageManager API.