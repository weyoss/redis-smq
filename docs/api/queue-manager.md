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
purgeDeadLetterQueue(queueName, ns, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgeAcknowledgedMessagesQueue

```javascript
purgeAcknowledgedMessagesQueue(queueName, ns, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgeQueue

```javascript
purgeQueue(queueName, ns, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.purgePriorityQueue

```javascript
purgePriorityQueue(queueName, ns, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
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
getQueueMetrics(queueName, ns, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `cb(err, queueMetrics)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.
    - `queueMetrics` *(object).* Queue metrics.
      - `queueMetrics.acknowledged` *(number).* Acknowledged messages count.
      - `queueMetrics.deadLettered` *(number).* Dead-lettered messages count.
      - `queueMetrics.pending` *(number).* Pending messages count.
      - `queueMetrics.pendingWithPriority` *(number).* Pending messages with priority count.

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

### QueueManager.prototype.quit

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.


