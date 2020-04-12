# Consumer Class API

Consumer properties like `messageConsumeTimeout`, `messageTTL`,
`messageRetryThreshold` and `messageRetryDelay` can also be defined
for a given message instance.

When defined, message instance properties always takes precedence over
consumer properties (options).

## Properties

### Consumer.prototype.id

The universally unique identifier of the consumer instance.

### Consumer.queueName

The name of the queue to consume messages from. The queue name can be composed only of letters (a-z), numbers (0-9) 
and (-_) characters.

### Consumer.prototype.config

The actual config object supplied to consumer class upon construction.

See [Consumer.prototype.constructor](#consumerprototypeconstructor).

### Consumer.prototype.options

The actual consumer options supplied to consumer class upon construction.

See [Consumer.prototype.constructor](#consumerprototypeconstructor).

### Consumer.prototype.messageConsumeTimeout

Consumer timeout for consuming a message, in milliseconds. By default messageConsumeTimeout is not set.

See [Consumer.prototype.constructor](#consumerprototypeconstructor).

### Consumer.prototype.messageTTL

Message TTL in milliseconds. By default messageTTL is not set.

See [Consumer.prototype.constructor](#consumerprototypeconstructor).

### Consumer.prototype.messageRetryThreshold

The number of times the message can be enqueued and delivered again. By default message retry threshold is 3.

See [Consumer.prototype.constructor](#consumerprototypeconstructor).

### Consumer.prototype.messageRetryDelay

The amount of time in seconds to wait for before re-queuing a failed message. By default message retry delay is 
not set.

See [Consumer.prototype.constructor](#consumerprototypeconstructor).

### Consumer.prototype.isTest

Whether or not the consumer is running in the test environment (when running tests).

## Methods

### Consumer.prototype.constructor()

**Syntax**

```text
Consumer([config[, options]])
```

**Parameters**

- `config` *(object): Optional.* Configuration parameters. See [configuration](https://github.com/weyoss/redis-smq#configuration).

- `options` *(object): Optional.* Consumer configuration parameters.

- `options.messageConsumeTimeout` *(Integer): Optional.* Also called job timeout, is the amount of time in
  milliseconds before a consumer consuming a message times out. If the consumer does not consume the message
  within the set time limit, the message consumption is automatically canceled and the message is re-queued
  to be consumed again. By default message consumption timeout is not set.
  
- `options.messageTTL` *(Integer): Optional.* All queue messages are guaranteed to not be consumed and destroyed if 
  they have been in the queue for longer than an amount of time called TTL (time-to-live) in milliseconds.
  
- `options.messageRetryThreshold` *(Integer): Optional.* Message retry threshold.
   Can be defined per message instance or per consumer. By default message retry threshold is set to 3.
  
- `options.messageRetryDelay` *(Integer): Optional.* Message retry delay in seconds. By default message retry delay is 
not set.

### Consumer.prototype.run()

Run the consumer and start consuming messages. No connection to the Redis server is opened before this method is called.

```javascript
const consumer = new TestQueueConsumer();
consumer.run();
```

### Consumer.prototype.consume()

Each consumer class is required override the `consume()` method of the base consumer which get called
each time a message received.

**Syntax**
```javascript
consumer.consume(message, cb);
```

**Parameters**

- `message` *(mixed): Required.* Actual message body published by the producer

- `cb(err)` *(function): Required.* Callback function. When called with the error argument the message is
    unacknowledged. Otherwise (when called without arguments) the message is acknowledged.

```javascript
class TestQueueConsumer extends Consumer {

    /**
     *
     * @param message
     * @param cb
     */
    consume(message, cb) {
        //  console.log(`Got a message to consume: `, message);
        //  
        //  throw new Error('TEST!');
        //  
        //  cb(new Error('TEST!'));
        //  
        //  const timeout = parseInt(Math.random() * 100);
        //  setTimeout(() => {
        //      cb();
        //  }, timeout);
        cb();
    }
}
```

### Consumer.prototype.shutdown()

Disconnect from Redis server and stop consuming messages. This method is used to gracefully shutdown the consumer and
go offline.

### Consumer.prototype.isRunning()

Tell whether the consumer is running or not. `true` if the consumer is running otherwise `false`.
