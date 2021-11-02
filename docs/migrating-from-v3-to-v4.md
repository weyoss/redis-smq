# Migrating from RedisSMQ v3.x.x to v4.x.x

If you are coming from a version older than v4 you should consider the following notes before upgrading your
RedisSMQ installation.

Here are the major breaking changes:

- Consumers no longer accepts `options` as a third parameter. Use the configuration object instead:

*Before v4:*
```javascript
const consumer = new Consumer(queueName, config, { consumerRetryDelay: 60 });
```

*Now:*
```javascript
// Now, use your configuration object
module.exports = {
  //...
  message: {
    retryDelay: 60000,
  },
};
```

See [Configuration](configuration.md) for more details.

- Type `TConsumerOptions` has been renamed to `TMessageDefaultOptions`.

- All timing message parameters and scheduling parameters are now only in milliseconds (`ttl`, `retryDelay`,
  `consumeTimeout`, `scheduledDelay`).


- Removed `Scheduler` class. Use `MessageManager` instead.

- Refactored `redisKeys`, which means that the keys format used before and now are incompatible. Before upgrading to the
  newest version, make sure that your Redis server is clean.

- `MonitorServer` has been refactored to use `async/await`:

*Before v4*

```javascript
MonitorServer(config).listen(() => {
  console.log('It works!');
});
```

*With the release of v4*

```javascript
MonitorServer(config)
  .listen()
  .then(() => {
    console.log('It works!');
  });
```
