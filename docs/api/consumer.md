# Consumer Class API

Consumer properties like `messageConsumeTimeout`, `messageTTL`, `messageRetryThreshold` and `messageRetryDelay` can 
also be defined for a given message instance.

When defined, message instance properties always takes precedence over consumer properties (options).

## Public properties

No public property exists.

## Methods

### Consumer.prototype.constructor()

**Syntax**

```javascript
const testQueueConsumer = new TestQueueConsumer(queueName , config, options)
```

**Parameters**
- `queueName` *(string): Required.* The name of the queue where produced messages are queued. It can be composed
  only of letters (a-z), numbers (0-9) and (-_) characters.

- `config` *(object): Optional.* Configuration parameters. See [configuration](https://github.com/weyoss/redis-smq#configuration).

- `options` *(object): Optional.* Consumer configuration parameters.

- `options.messageConsumeTimeout` *(Integer): Optional.* In milliseconds. Also called job timeout, is the amount of time in
  milliseconds before a consumer consuming a message times out. If the consumer does not consume the message
  within the set time limit, the message consumption is automatically canceled and the message is re-queued
  to be consumed again. By default, message consumption timeout is not set.
  
- `options.messageTTL` *(Integer): Optional.* In milliseconds. All queue messages are guaranteed to not be consumed and destroyed if 
  they have been in the queue for longer than an amount of time called TTL (time-to-live). By default, message TTL is not set.
  
- `options.messageRetryThreshold` *(Integer): Optional.* The number of times the message can be enqueued and delivered again.
   Can be defined per message instance or per consumer. By default, message retry threshold is set to 3.
  
- `options.messageRetryDelay` *(Integer): Optional.* In seconds. The amount of time in seconds to wait for before 
   re-queuing a failed message. By default, message retry delay is 60 seconds.

### Consumer.prototype.run()

Run the consumer and start consuming messages. No connection to the Redis server is opened until this method is called.

**Syntax**

```javascript
testQueueConsumer.run(cb);
```

**Parameters**
- `cb` *(function): Optional.* A callback function which get called once the consumer instance is up and running.

```javascript
const testQueueConsumer = new TestQueueConsumer('test_queue')
testQueueConsumer.run();

// or 
testQueueConsumer.run(() => {
    console.log('Consumer is now running...')
})

//
consumer.once('up', () => {
    console.log(`Consumer ID ${consumer.getId()} is running.`);
})
```

### Consumer.prototype.consume()

Each consumer class is required override the `consume()` method of the base consumer which get called
each time a message received.

**Syntax**
```javascript
consumer.consume(message, cb);
```

**Parameters**

- `message` *(mixed): Required.* A message instance which was previously published.

- `cb(err)` *(function): Required.* Callback function. When called with the error argument the message is
    unacknowledged. Otherwise, when called without arguments, the message is acknowledged.

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

**Syntax**

```javascript
testQueueConsumer.shutdown(cb);
```

**Parameters**
- `cb` *(function): Optional.* A callback function which get called once the consumer instance is totally down .

```javascript
const testQueueConsumer = new TestQueueConsumer('test_queue')

testQueueConsumer.run(() => {
    console.log('Consumer is now running...');
    testQueueConsumer.shutdown();
})

consumer.once('down', () => {
    console.log(`Consumer ID ${consumer.getId()} has gone down.`);
})
```

### Consumer.prototype.isRunning()

Tell whether the consumer is running or not. `true` if the consumer is running otherwise `false`.

## Other public methods

- Consumer.prototype.getId()
- Consumer.prototype.getQueueName()
- Consumer.prototype.getConfig()
- Consumer.prototype.getOptions()
- Consumer.prototype.getScheduler()

These methods are used internally and should not be used in your application:

- getInstanceRedisKeys()
- getBroker()
- isRunning()
- getStatsProvider()
- handleError()