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
const testQueueConsumer = new TestQueueConsumer(queueName , config)
```

**Parameters**
- `queueName` *(string): Required.* The name of the queue where produced messages are queued. It can be composed
  only of letters (a-z), numbers (0-9) and (-_) characters.

- `config` *(object): Optional.* Configuration parameters. See [configuration](https://github.com/weyoss/redis-smq#configuration).

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

### Consumer.prototype.getId()

### Consumer.prototype.getQueueName()