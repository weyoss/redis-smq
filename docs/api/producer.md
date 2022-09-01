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

- `config` *(object): Optional.*  See [Configuration](/docs/configuration.md) for more details.


### Producer.prototype.run()

Start your producer instance. No connection to Redis server is opened until this method is called.

Starting with v7.0.6 producer instances are no longer automatically started upon creation.

You have to run a producer before producing messages.

**Syntax**

```javascript
run(cb);
```

**Parameters**
- `cb(err, status)` *(function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `status` *(boolean).* Indicate whether the operation completed successfully.

### Producer.prototype.produce()

**Syntax**

```javascript
producer.produce(message, cb);
```

**Parameters**

- `message` *(Message): Required.* Message instance.
- `cb(err, reply)` *(function): Required.* Callback function.
  - `err` *(Error | null | undefined).* An error object will be returned in case of failures.
  - `reply` *(object | null).* Indicate whether the operation completed successfully.
    - `reply.scheduled` *(boolean).* Indicate whether the message has been scheduled.
    - `reply.messages` *(array).* A list of published messages.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message
        .setBody({ hello: 'world' })
        .setTTL(3600000)
        .setScheduledDelay(10000) // in millis
        .setQueue('test_queue');
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
