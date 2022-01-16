# Queue Manager API

```javascript
const { QueueManager } = require('redis-smq');
const config = require('./config');

QueueManager.getSingletonInstance(config, (err, queueManager) => {
  if (err) console.log(err);
  else {
    // ...
  }
})
```

## Public Static Methods

### QueueManager.getSingletonInstance()

```javascript
getSingletonInstance(config, cb)
```

**Parameters**
- `config` *(number): Required.* configuration object.
- `cb(err, queueManager)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.
    - `queueManager` *(QueueManager).* QueueManager instance.

## Public Methods

### QueueManager.prototype.getMessageQueues

```javascript
getMessageQueues(cb);
```

**Parameters**
- `cb(err, messageQueues)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `messageQueues` *(Array).*
    - `messageQueues[*].ns` *(string).* Queue namespace.
    - `messageQueues[*].name` *(string).* Queue name.

### QueueManager.prototype.deleteMessageQueue

```javascript
deleteMessageQueue(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used.
  Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

Before deleting a message queue, make sure that the given queue is being in use. Otherwise, an error will be returned.

### QueueManager.prototype.getQueueMetrics

```javascript
getQueueMetrics(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used.
  Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err, queueMetrics)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `queueMetrics` *(object).* Queue metrics.
    - `queueMetrics.acknowledged` *(number).* Acknowledged messages count.
    - `queueMetrics.deadLettered` *(number).* Dead-lettered messages count.
    - `queueMetrics.pending` *(number).* Pending messages count.
    - `queueMetrics.pendingWithPriority` *(number).* Pending messages with priority count.
    
### QueueManager.prototype.purgeDeadLetteredQueue

```javascript
purgeDeadLetteredQueue(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgeAcknowledgedQueue

```javascript
purgeAcknowledgedQueue(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgePendingQueue

```javascript
purgePendingQueue(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgePriorityQueue

```javascript
purgePriorityQueue(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgeScheduledQueue

```javascript
purgeScheduledQueue(cb);
```

**Parameters**
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.quit

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.


