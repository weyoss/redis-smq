# Message Manager API

```javascript
const { MessageManager } = require('redis-smq');
const config = require('./config');

MessageManager.getSingletonInstance(config, (err, messageManager) => {
  if (err) console.log(err);
  else {
    // ...
  }
})
```

## Public properties

No public property exists.

## Public methods

### MessageManager.prototype.getAcknowledgedMessages()
### MessageManager.prototype.getDeadLetterMessages()
### MessageManager.prototype.getPendingMessages()
### MessageManager.prototype.getPendingMessagesWithPriority()
### MessageManager.prototype.getScheduledMessages()
### MessageManager.prototype.getMessageMetadata()
### MessageManager.prototype.quit()

## Public static methods

### MessageManager.getSingletonInstance()