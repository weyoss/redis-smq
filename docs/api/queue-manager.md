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

### QueueManager.prototype.purgeDeadLetterQueue

```javascript
purgeDeadLetterQueue(queueName, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgeAcknowledgedMessagesQueue

```javascript
purgeAcknowledgedMessagesQueue(queueName, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgeQueue

```javascript
purgeQueue(queueName, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgePriorityQueue

```javascript
purgePriorityQueue(queueName, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgeScheduledMessagesQueue

```javascript
purgeScheduledMessagesQueue(cb);
```

**Parameters**
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.getQueueMetrics

```javascript
getQueueMetrics(queueName, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `cb(err, queueMetrics)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.
    - `queueMetrics` *(object).* Queue metrics.
      - `queueMetrics.acknowledged` *(number).* Acknowledged messages count.
      - `queueMetrics.deadLettered` *(number).* Dead-lettered messages count.
      - `queueMetrics.pending` *(number).* Pending messages count.
      - `queueMetrics.pendingWithPriority` *(number).* Pending messages with priority count.

### QueueManager.prototype.quit

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.


