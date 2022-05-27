# Producer Class API

```javascript
const { Producer } = require('redis-smq');
```

## Public Methods

### Producer.prototype.constructor()

**Syntax**

```javascript
const producer = new Producer(config);
```

**Parameters**

- `config` *(object): Optional.*  See [Configuration](docs/configuration.md) for more details.


### Producer.prototype.produce()

**Syntax**

```javascript
producer.produce(message, cb);
```

**Parameters**

- `message` *(Message): Required.* Message instance.
- `cb(err)` *(function): Required.* Callback function.

```javascript
const { Message, Producer } = require('redis-smq');

const message = new Message();

message
        .setBody({ hello: 'world' })
        .setTTL(3600000)
        .setScheduledDelay(10000) // in millis
        .setQueue('test_queue');

const producer = new Producer();
producer.produce(message, (err) => {
  if (err) console.log(err);
  else console.log('Successfully produced')
});
```

Before publishing a message, make sure that:

- The queue of the message does exist.
- Messages with a priority are published to a priority queue.
- Messages without priority are published to a LIFO queue.

Otherwise, an error will be returned.

### Producer.prototype.run()

Start your producer instance. No connection to Redis server is opened until this method is called.

Contrary to consumer instances, producer instances are automatically started upon creation.

**Syntax**

```javascript
run(cb);
```

**Parameters**
- `cb(err, status)` *(function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `status` *(boolean).* Indicate whether the operation completed successfully.

### Producer.prototype.shutdown()

Gracefully shut down your producer instance and go offline.

**Syntax**

```javascript
shutdown(cb);
```

**Parameters**
- `cb(err, status)` *(function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `status` *(boolean).* Indicate whether the operation completed successfully.

### Other Methods

- Producer.prototype.isGoingUp()
- Producer.prototype.isGoingDown()
- Producer.prototype.isUp()
- Producer.prototype.isDown()
- Producer.prototype.isRunning()
- Producer.prototype.getId()
