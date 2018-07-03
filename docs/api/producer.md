# Producer Class API

## Properties

### Producer.prototype.id

The universally unique identifier of the producer.

### Producer.prototype.queueName

The name of the queue where messages are to be enqueued for delivery. The queue name can be composed only of letters (a-z), numbers (0-9) 
and (-_) characters.

See [Producer.prototype.constructor](#producerprototypeconstructor).

### Consumer.prototype.config

The actual config object supplied to producer class upon construction.

See [Producer.prototype.constructor](#producerprototypeconstructor).

### Producer.prototype.isTest

Whether or not the producer is running in the test environment (when running tests).

## Methods

### Producer.prototype.constructor()

**Syntax**

```javascript
const producer = new Producer(queueName, config)
```

**Parameters**
  
- `queueName` *(string): Required.* The name of the queue where produced messages are queued. It can be composed 
  only of letters (a-z), numbers (0-9) and (-_) characters.

- `config` *(object): Required.* Configuration parameters. See [configuration](https://github.com/weyoss/redis-smq#configuration).

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

- `message` *(mixed): Required.* Message instance.    

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
```

### Producer.prototype.produce() - deprecated

Create a message based on the provided content/payload and send it to the message queue.

This method is deprecated and will be removed in future releases. Please use `produceMessage()` 
instead.

**Syntax**

```javascript
producer.produce(payload, cb);
```

**Parameters**
    
- `payload` *(mixed): Required.* The actual content/payload to be delivered to a consumer.    

- `cb(err)` *(function): Required.* Callback function.
 
```javascript
producer.produce({ hello: 'world' }, (err) => {
    if (err) console.log(err);
    else console.log('Successfully published!');
});
```

### Producer.prototype.produceWithTTL() - deprecated

Create a message based on the provided content/payload and TTL (time-to-live) then send it to the message queue.

This method is deprecated and will be removed in future releases. Please use `produceMessage()` 
instead.

**Syntax**

```javascript
producer.produceWithTTL(payload, ttl, cb)
```

**Parameters**
    
- `payload` *(mixed): Required.* The actual content/payload to be delivered to a consumer.    

- `ttl` *(Integer): Required.* Message TTL in milliseconds. 

- `cb(err)` *(function): Required.* Callback function.
    
```javascript
producer.produceWithTTL({ hello: 'world' }, 60000, (err) => {
    if (err) console.log(err);
    else console.log('Successfully published!');
});
```

### Producer.prototype.shutdown()

Gracefully shutdown the producer and disconnect from the redis server.

This method should be used only in rare cases where we need to force the producer to terminate its work.

Normally a producer should be kept always online.

```javascript
producer.produceMessage(message, (err) => {
    if (err) console.log(err);
    else console.log('Successfully published!');
    producer.shutdown(); // Shutdown the producer and disconnect from the Redis server.   
});
```