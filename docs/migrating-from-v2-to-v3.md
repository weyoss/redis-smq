# Migrating from RedisSMQ v2.x.x to v3.x.x

Upgrading your installation to the newest version should be straightforward as most APIs are compatible, with some 
exceptions:

- Configuration. Removed deprecated redis parameters and renamed `redis.driver` to `redis.client`. If you supply a 
  configuration for Redis make sure to specify the correct parameters:

```javascript
// Before: using a deprecated syntax
module.exports = {
  // ...
  redis: {
      host: '127.0.0.1',
      port: 6379,
      connect_timeout: 3600000,
  },
  
}
// Before: or doing this way  
module.exports = {
  // ...
  redis: {
    driver: 'redis',
    options: {
      host: '127.0.0.1',
      port: 6379,
      connect_timeout: 3600000,
    },
  },

}

// Now  
module.exports = {
  redis: {
    client: 'redis',
    options: {
      host: '127.0.0.1',
      port: 6379,
      connect_timeout: 3600000,
    },
  },
}
```

- Consumer queue name. Static property `TestQueueConsumer.queueName` is no more supported. Now Queue name is the first argument of a consumer constructor:

```javascript
// Before
class TestQueueConsumer extends Consumer {
  consume(message, cb) {
    // ...
  }
}

TestQueueConsumer.queueName = 'my_queue';
const myTestQueueConsumer = new TestQueueConsumer();

// Now
class TestQueueConsumer extends Consumer {
  consume(message, cb) {
    // ...
  }
}

const myTestQueueConsumer = new TestQueueConsumer('my_queue');
```

- Consumer.consume(msg, cb). The `msg` payload is now an instance of Message instead of the message body:

```javascript
// Before
class TestQueueConsumer extends Consumer {
  consume(msg, cb) {
    // the msg is the message.body 
    // msg instanceof Message // false
  }
}

// Now
class TestQueueConsumer extends Consumer {
  consume(msg, cb) {
    // msg instanceof Message // true
    // use message.getBody() to get your data
  }
}
```

- Message static properties. Removed all `Message.PROPERTY_*` and `Message.getProperty()`. Use getters instead:
```javascript
const message = new Message();

// Before
message.getProperty(Message.PROPERTY_RETRY_DELAY);

// Now
message.getRetryDelay();
```

## For TypeScript users

Updated almost all typings. Some breaking changes include interfaces and types renaming (for example`ConfigInterface` 
to `IConfig`, `RedisDriver` to `RedisClientName`, etc.)