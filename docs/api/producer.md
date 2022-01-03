# Producer Class API

```javascript
const {Message, Producer} = require('redis-smq');

const message = new Message();
message.setBody({hello: 'world'});

const producer = new Producer('test_queue');
producer.produce(message, (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced')
});

```

## Public Methods

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

### Producer.prototype.produce()

**Syntax**

```javascript
producer.produce(message, cb);
```

**Parameters**

- `message` *(mixed): Required.* Can be a Message instance or any valid JavaScript data type that represents the Message body.    

- `cb(err)` *(function): Required.* Callback function.

```javascript
const {Message, Producer} = require('redis-smq');

const message = new Message();

message
        .setBody({hello: 'world'})
        .setTTL(3600000)
        .setScheduledDelay(10000); // in millis

const producer = new Producer('test_queue');
producer.produce(message, (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced')
});

// OR
producer.produce({hello: 'world'}, (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced')
});
```

### Producer.prototype.shutdown()

Gracefully shutdown the producer and disconnect from the Redis server.

```javascript
producer.once('down', () => {
  console.log(`Producer ID ${producer.getId()} has gone down.`);
});

producer.produce(message, (err) => {
  if (err) console.log(err);
  else {
    console.log('Successfully published!');
    producer.shutdown(); // Shutdown the producer and disconnect from the Redis server.   
  }
});
```

### Producer.prototype.run()

Start a producer that was previously shutdown. 

This method should be ONLY used when you have manually called the `shutdown()` method.

```javascript
producer.once('down', () => {
  console.log(`Producer ID ${producer.getId()} has gone down.`);
  producer.run();
})

producer.once('up', () => {
  console.log(`Producer ID ${producer.getId()} is running.`);
})

producer.produce(message, (err) => {
  if (err) console.log(err);
  else {
    console.log('Successfully published!');
    producer.shutdown(); // Shutdown the producer and disconnect from the Redis server.   
  }
});
```

### Other Methods

- Producer.prototype.isGoingUp()
- Producer.prototype.isGoingDown()
- Producer.prototype.isUp()
- Producer.prototype.isDown()
- Producer.prototype.isRunning()
- Producer.prototype.getId()
- Producer.prototype.getQueue()