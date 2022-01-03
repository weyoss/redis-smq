# MultiQueueProducer Class API

```javascript
const { Message, MultiQueueProducer } = require('redis-smq');

const message = new Message();
message.setBody({hello: 'world'});

const producer = new MultiQueueProducer();
producer.produce('test_queue', message, (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced')
});

```

## Public Methods

### MultiQueueProducer.prototype.constructor()

**Syntax**

```javascript
const producer = new MultiQueueProducer(config)
```

**Parameters**

- `config` *(object): Optional.* Configuration parameters. See [configuration](https://github.com/weyoss/redis-smq#configuration).

```javascript
const { MultiQueueProducer } = require('redis-smq');
const producer = new MultiQueueProducer({namespace: 'test_project'});
```

### MultiQueueProducer.prototype.produce()

**Syntax**

```javascript
producer.produce(queueName, message, cb);
```

**Parameters**

- `queueName` *(string): Required.* The name of the queue where produced messages are queued. It can be composed
  only of letters (a-z), numbers (0-9) and (-_) characters.

- `message` *(mixed): Required.* Can be a Message instance or any valid JavaScript data type that represents the Message body.    

- `cb(err)` *(function): Required.* Callback function.


```javascript
const { Message, MultiQueueProducer } = require('redis-smq');

const message = new Message();

message
    .setBody('Some data')
    .setTTL(3600000)
    .setScheduledDelay(10000); // in millis

const producer = new MultiQueueProducer();
producer.produce('test_queue', message, (err) => {
   if (err) console.log(err);
   else console.log('Successfully produced')
});

// OR
producer.produce('test_queue', 'Some data', (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced')
});
```

### MultiQueueProducer.prototype.shutdown()

Gracefully shutdown the producer and disconnect from the Redis server.

```javascript
producer.once('down', () => {
  console.log(`Producer ID ${producer.getId()} has gone down.`);
});

producer.produce('test_queue', message, (err) => {
    if (err) console.log(err);
    else {
      console.log('Successfully published!');
      producer.shutdown(); // Shutdown the producer and disconnect from the Redis server.   
    }
});
```

### MultiQueueProducer.prototype.run()

Start a producer that was previously shutdown. 

This method should be ONLY used when you have manually called the [shutdown()](#multiqueueproducerprototypeshutdown) method. 

```javascript
producer.once('down', () => {
  console.log(`Producer ID ${producer.getId()} has gone down.`);
  producer.run();
})

producer.once('up', () => {
  console.log(`Producer ID ${producer.getId()} is running.`);
})

producer.produce('test_queue', message, (err) => {
    if (err) console.log(err);
    else {
      console.log('Successfully published!');
      producer.shutdown(); // Shutdown the producer and disconnect from the Redis server.   
    }
});
```

### Other Methods

- MultiQueueProducer.prototype.isGoingUp()
- MultiQueueProducer.prototype.isGoingDown()
- MultiQueueProducer.prototype.isUp()
- MultiQueueProducer.prototype.isDown()
- MultiQueueProducer.prototype.isRunning()
- MultiQueueProducer.prototype.getId()