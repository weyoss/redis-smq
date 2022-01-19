# Producer Class API

```javascript
const {Message, Producer} = require('redis-smq');

const message = new Message();
message.setBody({hello: 'world'}).setQueue('test_queue');

const producer = new Producer();
producer.produce(message, (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced')
});

```

## Public Methods

### Producer.prototype.constructor()

**Syntax**

```javascript
const producer = new Producer(config)
```

**Parameters**

- `config` *(object): Optional.* Configuration parameters. See [configuration](https://github.com/weyoss/redis-smq#configuration).

```javascript
const { Producer } = require('redis-smq');
const producer = new Producer({namespace: 'test_project'});
```

### Producer.prototype.produce()

**Syntax**

```javascript
producer.produce(message, cb);
```

**Parameters**

- `message` *(Message): Required.* Message instance.
- `cb(err)` *(function): Required.* Callback function.

```javascript
const {Message, Producer} = require('redis-smq');

const message = new Message();

message
    .setBody({hello: 'world'})
    .setTTL(3600000)
    .setScheduledDelay(10000) // in millis
    .setQueue('test_queue');

const producer = new Producer();
producer.produce(message, (err) => {
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