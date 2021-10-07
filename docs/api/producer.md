# Producer Class API

## Public properties

No public property exists.

## Public methods

### Producer.prototype.constructor()

**Syntax**

```javascript
const producer = new Producer(queueName, config)
```

**Parameters**
  
- `queueName` *(string): Required.* The name of the queue where produced messages are queued. It can be composed 
  only of letters (a-z), numbers (0-9) and (-_) characters.

- `config` *(object): Optional.* Configuration parameters. See [configuration](https://github.com/weyoss/redis-smq#configuration).

```javascript
const { Producer } = require('redis-smq');
const producer = new Producer('test_queue', {namespace: 'test_project'});
```

### Producer.prototype.produceMessage()

**Syntax**

```javascript
producer.produceMessage(message, cb);
```

**Parameters**

- `message` *(mixed): Required.* Can be a Message instance or any valid JavaScript data type that represents the Message body.    

- `cb(err)` *(function): Required.* Callback function.


```javascript
const { Message, Producer } = require('redis-smq');

const message = new Message();

message
    .setBody({hello: 'world'})
    .setTTL(3600000)
    .setScheduledDelay(10);

const producer = new Producer('test_queue');
producer.produceMessage(message, (err) => {
   if (err) console.log(err);
   else console.log('Successfully produced')
});

// OR
producer.produceMessage({hello: 'world'}, (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced')
});
```

### Producer.prototype.shutdown()

Gracefully shutdown the producer and disconnect from the redis server.

This method should be used only in rare cases where we need to force the producer to terminate its work.

Normally a producer should be kept always online.

```javascript
producer.once('down', () => {
  console.log(`Producer ID ${producer.getId()} has gone down.`);
});

producer.produceMessage(message, (err) => {
    if (err) console.log(err);
    else {
      console.log('Successfully published!');
      producer.shutdown(); // Shutdown the producer and disconnect from the Redis server.   
    }
});
```

### Producer.prototype.run()

Start up a producer that was previously shutdown. 

This method should be ONLY used when you have manually called the `shutdown()` method. 

```javascript
producer.once('down', () => {
  console.log(`Producer ID ${producer.getId()} has gone down.`);
  producer.run();
})

producer.once('up', () => {
  console.log(`Producer ID ${producer.getId()} is running.`);
})

producer.produceMessage(message, (err) => {
    if (err) console.log(err);
    else {
      console.log('Successfully published!');
      producer.shutdown(); // Shutdown the producer and disconnect from the Redis server.   
    }
});
```

### Producer.prototype.isRunning()

Tell whether the producer is running or not. `true` if the producer is running, otherwise `false`.

## Other public methods

- Producer.prototype.getId()
- Producer.prototype.getConfig()
- Producer.prototype.getQueueName()
- Producer.prototype.getScheduler()
- 
These methods are used internally and should not be used in your application:

- getInstanceRedisKeys()
- getBroker()
- getStatsProvider()
- handleError()
