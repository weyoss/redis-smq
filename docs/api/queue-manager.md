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

## Public properties

No public property exists.

## Public methods

### QueueManager.prototype.purgeDeadLetterQueue

```javascript

```

### QueueManager.prototype.purgeAcknowledgedMessagesQueue

```javascript

```

### QueueManager.prototype.purgeQueue

```javascript

```

### QueueManager.prototype.purgePriorityQueue

```javascript

```

### QueueManager.prototype.purgeScheduledMessagesQueue

```javascript

```

### QueueManager.prototype.getQueueMetrics

```javascript

```

### QueueManager.prototype.quit

```javascript

```

## Public static methods

### QueueManager.getSingletonInstance()

```javascript

```
