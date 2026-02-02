[RedisSMQ](../README.md) / [Docs](README.md) / Message Exchanges

# Message Exchanges

Exchanges route messages to queues based on rules. Instead of sending directly to a queue, you publish to an exchange which handles the routing.

## When to Use Exchanges

| Use Case                             | Best Choice                     |
| ------------------------------------ | ------------------------------- |
| Send to one specific queue           | **Direct queue** (`setQueue()`) |
| Route to queues by exact key         | Direct exchange                 |
| Route by patterns (user.\*, order.#) | Topic exchange                  |
| Broadcast to multiple queues         | Fanout exchange                 |

**Performance Tip**: `setQueue()` is fastest. Use exchanges only when you need their routing features.

## Exchange Types

### 1. Direct Exchange

Routes to queues with exact routing key matches.

```javascript
const msg = new ProducibleMessage()
  .setDirectExchange('payments')
  .setExchangeRoutingKey('payment.processed') // Must match exactly
  .setBody({ amount: 99.99 });
```

### 2. Topic Exchange

Routes using pattern matching:

- `*` = one word
- `#` = zero or more words
- Words separated by dots

```javascript
const msg = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.login.success')
  .setBody({ userId: 123 });

// Patterns that would match:
// 'user.login.success' → 'user.*.success', 'user.#', '*.login.*'
```

### 3. Fanout Exchange

Broadcasts to all bound queues.

```javascript
const msg = new ProducibleMessage()
  .setFanoutExchange('alerts') // No routing key needed
  .setBody({ alert: 'System down!' });
```

## Setup

### Bind Queues to Exchanges

```javascript
const { RedisSMQ } = require('redis-smq');

// Direct exchange (exact match)
const direct = RedisSMQ.createDirectExchange();
direct.bindQueue('email-queue', 'notifications', 'welcome.email', (err) => {
  if (err) console.error('Bind failed:', err);
});

// Topic exchange (pattern match)
const topic = RedisSMQ.createTopicExchange();
topic.bindQueue('audit-queue', 'events', 'user.*', (err) => {
  if (err) console.error('Bind failed:', err);
});

// Fanout exchange (broadcast)
const fanout = RedisSMQ.createFanoutExchange();
fanout.bindQueue('sms-queue', 'alerts', (err) => {
  if (err) console.error('Bind failed:', err);
});
```

**Note**: Exchanges are created automatically when first bound.

## Sending Messages

### Direct to Queue (Fastest)

```javascript
const msg = new ProducibleMessage()
  .setQueue('orders') // Direct delivery
  .setBody({ item: 'Book' });
```

### Through Exchange

```javascript
const msg = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('order.created') // REQUIRED for direct/topic
  .setBody({ orderId: 456 });

producer.produce(msg, (err, messageIds) => {
  if (err) {
    if (err.message.includes('No matching queues')) {
      console.log('No queues bound to this routing key');
    }
  } else {
    console.log(`Sent to ${messageIds.length} queue(s)`);
  }
});
```

## Managing Exchanges

### Check Bindings

```javascript
direct.getRoutingKeys('notifications', (err, keys) => {
  console.log('Bound routing keys:', keys);
  // Returns: ['welcome.email', 'password.reset', ...]
});
```

### Unbind Queues

```javascript
// Direct/Topic exchange
direct.unbindQueue('email-queue', 'notifications', 'welcome.email', (err) => {
  if (!err) console.log('Queue unbound');
});

// Fanout exchange
fanout.unbindQueue('sms-queue', 'alerts', (err) => {
  if (!err) console.log('Queue unbound');
});
```

### Delete Exchange

```javascript
// Only works when no queues are bound
direct.delete('notifications', (err) => {
  if (err) console.error('Delete failed:', err);
  else console.log('Exchange deleted');
});
```

## Common Patterns

### Event System

```javascript
// Publisher
msg.setTopicExchange('app-events');
msg.setExchangeRoutingKey('user.profile.updated');

// Subscribers bind with patterns:
// 'user.*'       - All user events
// '*.updated'    - All update events
// 'user.profile.*' - Profile-related events
```

### Multi-Channel Notifications

```javascript
// Bind multiple queues
fanout.bindQueue('email-service', 'notifications', callback);
fanout.bindQueue('sms-service', 'notifications', callback);
fanout.bindQueue('push-service', 'notifications', callback);

// Send once, delivers to all
msg.setFanoutExchange('notifications');
msg.setBody({ message: 'Sale starts now!' });
```

## Best Practices

1. **Use `setQueue()` for simple cases** - It's faster and simpler
2. **Plan your routing key structure** - Use dots for hierarchy: `domain.entity.action`
3. **Check for matching queues** - Handle "No matching queues" errors gracefully
4. **Set up bindings at startup** - Configure routing before sending messages
5. **Monitor exchange usage** - Too many patterns can impact performance

---

**Related Documentation**:

- [Producing Messages](producing-messages.md) - How to send messages
- [Consuming Messages](consuming-messages.md) - How to receive messages
- [Queues](queues.md) - Queue management
- [Exchange API](api/classes/ExchangeDirect.md) - Detailed exchange methods
