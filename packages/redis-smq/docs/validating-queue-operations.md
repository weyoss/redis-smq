[RedisSMQ](../README.md) / [Docs](README.md) / Validating Queue Operations

# Validating Queue Operations

RedisSMQ provides `QueueOperationValidator` to check if operations are allowed on a queue based on its current state. This ensures operations are only performed when the queue is in an appropriate state.

## Queue States & Allowed Operations

| State       | Description        | Allowed Operations                                                       |
| ----------- | ------------------ | ------------------------------------------------------------------------ |
| **ACTIVE**  | Fully operational  | All operations                                                           |
| **PAUSED**  | Temporarily paused | All except CONSUME                                                       |
| **STOPPED** | Stopped            | Management only (purge, delete, rate limits, consumer groups, exchanges) |
| **LOCKED**  | Locked             | None                                                                     |

## Methods

### Check single operations

| Method                     | Description                               | Allowed In        |
| -------------------------- | ----------------------------------------- | ----------------- |
| `canConsume()`             | Check if messages can be consumed         | ACTIVE only       |
| `canProduce()`             | Check if messages can be published        | ACTIVE, PAUSED    |
| `canDelete()`              | Check if queue can be deleted             | All except LOCKED |
| `canDeleteMessage()`       | Check if specific messages can be deleted | All except LOCKED |
| `canPurge()`               | Check if all messages can be removed      | All except LOCKED |
| `canRequeue()`             | Check if messages can be reprocessed      | All except LOCKED |
| `canSetRateLimit()`        | Check if rate limiting can be added       | All except LOCKED |
| `canClearRateLimit()`      | Check if rate limiting can be removed     | All except LOCKED |
| `canCreateConsumerGroup()` | Check if consumer group can be created    | All except LOCKED |
| `canDeleteConsumerGroup()` | Check if consumer group can be deleted    | All except LOCKED |
| `canBindExchange()`        | Check if exchange can be bound            | All except LOCKED |
| `canUnbindExchange()`      | Check if exchange can be unbound          | All except LOCKED |

## Usage Examples

### Check if you can consume

```typescript
QueueOperationValidator.canConsume('orders-queue', (err, canConsume) => {
  if (err) return console.error(err);
  if (canConsume) startConsumer();
  else console.log('Queue is not available for consumption');
});
```

### Check if you can produce

```typescript
QueueOperationValidator.canProduce('notifications-queue', (err, canProduce) => {
  if (err) return console.error(err);
  if (canProduce) producer.send(message);
  else console.log('Queue is not accepting messages');
});
```

### Check if you can delete a queue

```typescript
QueueOperationValidator.canDelete('temp-queue', (err, canDelete) => {
  if (err) return console.error(err);
  if (canDelete) queueManager.deleteQueue('temp-queue');
});
```

### Check if you can purge a queue

```typescript
QueueOperationValidator.canPurge('test-queue', (err, canPurge) => {
  if (err) return console.error(err);
  if (canPurge) queueManager.purgeQueue('test-queue');
});
```

## API Reference

For complete method signatures, see [QueueOperationValidator API Reference](api/classes/QueueOperationValidator.md).
