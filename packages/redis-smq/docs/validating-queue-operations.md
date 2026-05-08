# Validating Queue Operations

`QueueOperationValidator` checks if an operation is allowed on a queue based on its current state. Use it to avoid errors before attempting operations that may be rejected.

## Queue States and Allowed Operations

| State       | Description        | Allowed Operations                                                       |
| ----------- | ------------------ | ------------------------------------------------------------------------ |
| **ACTIVE**  | Fully operational  | All operations                                                           |
| **PAUSED**  | Temporarily paused | All except CONSUME                                                       |
| **STOPPED** | Stopped            | Management only (purge, delete, rate limits, consumer groups, exchanges) |
| **LOCKED**  | Locked             | None                                                                     |

## Methods

### Consumption and Production

```javascript
const { QueueOperationValidator } = require('redis-smq');

// Check if messages can be consumed
QueueOperationValidator.canConsume('orders', (err, canConsume) => {
  if (err) return console.error(err);
  if (canConsume) startConsumer();
  else console.log('Queue is not available for consumption');
});

// Check if messages can be published
QueueOperationValidator.canProduce('notifications', (err, canProduce) => {
  if (err) return console.error(err);
  if (canProduce) producer.send(message);
  else console.log('Queue is not accepting messages');
});
```

### Queue Management

```javascript
// Check if queue can be deleted
QueueOperationValidator.canDelete('temp-queue', (err, canDelete) => {
  if (canDelete) queueManager.delete('temp-queue', callback);
});

// Check if messages can be purged
QueueOperationValidator.canPurge('test-queue', (err, canPurge) => {
  if (canPurge) queueManager.purge('test-queue', callback);
});

// Check if messages can be requeued
QueueOperationValidator.canRequeue('orders', (err, canRequeue) => {
  if (canRequeue) messageManager.requeueMessageById(messageId, callback);
});
```

### Rate Limits

```javascript
QueueOperationValidator.canSetRateLimit('orders', (err, canSet) => {
  if (canSet)
    rateLimitManager.set('orders', { limit: 100, interval: 60000 }, callback);
});

QueueOperationValidator.canClearRateLimit('orders', (err, canClear) => {
  if (canClear) rateLimitManager.clear('orders', callback);
});
```

### Consumer Groups

```javascript
QueueOperationValidator.canCreateConsumerGroup(
  'notifications',
  (err, canCreate) => {
    if (canCreate)
      consumerGroups.saveConsumerGroup(
        'notifications',
        'email-service',
        callback,
      );
  },
);

QueueOperationValidator.canDeleteConsumerGroup(
  'notifications',
  (err, canDelete) => {
    if (canDelete)
      consumerGroups.deleteConsumerGroup(
        'notifications',
        'email-service',
        callback,
      );
  },
);
```

### Exchange Bindings

```javascript
QueueOperationValidator.canBindExchange('orders', (err, canBind) => {
  if (canBind)
    directExchange.bindQueue('orders', 'app', 'order.created', callback);
});

QueueOperationValidator.canUnbindExchange('orders', (err, canUnbind) => {
  if (canUnbind)
    directExchange.unbindQueue('orders', 'app', 'order.created', callback);
});
```

## All Methods

| Method                     | Description                      | Active | Paused | Stopped | Locked |
| -------------------------- | -------------------------------- | ------ | ------ | ------- | ------ |
| `canConsume()`             | Messages can be consumed         | ✓      | ✗      | ✗       | ✗      |
| `canProduce()`             | Messages can be published        | ✓      | ✓      | ✗       | ✗      |
| `canDelete()`              | Queue can be deleted             | ✓      | ✓      | ✓       | ✗      |
| `canDeleteMessage()`       | Specific messages can be deleted | ✓      | ✓      | ✓       | ✗      |
| `canPurge()`               | All messages can be removed      | ✓      | ✓      | ✓       | ✗      |
| `canRequeue()`             | Messages can be reprocessed      | ✓      | ✓      | ✓       | ✗      |
| `canSetRateLimit()`        | Rate limiting can be added       | ✓      | ✓      | ✓       | ✗      |
| `canClearRateLimit()`      | Rate limiting can be removed     | ✓      | ✓      | ✓       | ✗      |
| `canCreateConsumerGroup()` | Consumer group can be created    | ✓      | ✓      | ✓       | ✗      |
| `canDeleteConsumerGroup()` | Consumer group can be deleted    | ✓      | ✓      | ✓       | ✗      |
| `canBindExchange()`        | Exchange can be bound            | ✓      | ✓      | ✓       | ✗      |
| `canUnbindExchange()`      | Exchange can be unbound          | ✓      | ✓      | ✓       | ✗      |

## Using with Namespaces

```javascript
// Check by queue params object
QueueOperationValidator.canConsume(
  { ns: 'production', name: 'orders' },
  (err, canConsume) => {
    // ...
  },
);

// Check by queue name string (uses default namespace)
QueueOperationValidator.canConsume('orders', (err, canConsume) => {
  // ...
});
```

## Promise Style

```javascript
const canConsume = await QueueOperationValidator.canConsume('orders');
if (canConsume) {
  // Start consumer
}
```

## Best Practices

- **Check before acting** — validate state before attempting operations that may fail
- **Handle state changes** — a queue's state can change between validation and operation
- **Use with state events** — subscribe to state change events to react dynamically
