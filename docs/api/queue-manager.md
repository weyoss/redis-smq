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

### QueueManager.prototype.getProcessingQueues()
### QueueManager.prototype.getMessageQueues()
### QueueManager.prototype.getDeadLetterQueues()
### QueueManager.prototype.getQueueMetadata()
### QueueManager.prototype.quit()

## Public static methods

### QueueManager.getSingletonInstance()