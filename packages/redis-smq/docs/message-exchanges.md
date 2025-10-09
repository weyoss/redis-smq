[RedisSMQ](../README.md) / [Docs](README.md) / Message Exchanges

# Message Exchanges

RedisSMQ exchanges provide intelligent message routing to deliver messages to one or multiple queues based on routing 
strategies.

Important
- Initialize RedisSMQ once per process using `RedisSMQ.initialize(...)` or `RedisSMQ.initializeWithConfig(...)`.
- When components are created via RedisSMQ factory methods, you typically do not need to shut them down individually; 
prefer a single `RedisSMQ.shutdown(cb)` at application exit to close shared infrastructure and tracked components.

## Overview

Instead of sending messages directly to specific queues, you can publish messages to exchanges, which route them to 
appropriate queues based on routing rules.

Performance note
- Fastest: Direct Queue Publishing (no exchange). If you know the destination queue, `setQueue('...')` and do not set 
an exchange. This avoids exchange lookups and is faster than using a direct exchange.
- Next-best: Direct exchange (exact-match routing).
- Heavier: Topic exchange (wildcard matching).
- Fanout: Broadcast to all bound queues (multiplies work).

### Exchange Types

| Type        | Routing Strategy                | Use Case                                     |
|-------------|---------------------------------|----------------------------------------------|
| Direct      | Exact routing key match         | Point-to-point messaging, task queues        |
| Topic       | Pattern matching with wildcards | Event-driven architecture, selective routing |
| Fanout      | Broadcast to all bound queues   | Notifications, logging, broadcasting         |

### Key Benefits

- Flexible routing: Send messages to multiple queues simultaneously
- Decoupling: Producers don't need to know specific queue names
- Scalability: Add new consumers without changing producer code

## Quick Start

### Direct Queue Publishing (No Exchange)

For simple point-to-point messaging with the highest performance, publish directly to a queue. This is faster than 
using a direct exchange.

```javascript
'use strict';

const { ProducibleMessage } = require('redis-smq');

const message = new ProducibleMessage()
  .setQueue('user.notifications')    // direct queue publishing (fastest path)
  .setBody({ userId: 123, message: 'Welcome!' });
```

### Exchange-Based Routing

For advanced routing, use exchanges:

```javascript
'use strict';

const { ProducibleMessage } = require('redis-smq');

// Direct Exchange - exact routing key match
const directMessage = new ProducibleMessage()
  .setDirectExchange('orders')
  .setExchangeRoutingKey('order.created')
  .setBody({ orderId: 'ORD-001', status: 'created' });

// Topic Exchange - pattern matching
const topicMessage = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.profile.updated')
  .setBody({ userId: 123, field: 'email' });

// Fanout Exchange - broadcast to all
const fanoutMessage = new ProducibleMessage()
  .setFanoutExchange('notifications')
  .setBody({ alert: 'System maintenance in 10 minutes' });
```

## Exchange Setup

Important
- Exchanges are created automatically when you first bind a queue to them. No explicit creation step is required.

### Binding Queues to Exchanges

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');

// Direct Exchange
const directExchange = RedisSMQ.createDirectExchange();
directExchange.bindQueue('order-processor', 'orders', 'order.created', (err) => {
  if (err) console.error('Binding failed:', err);
  else console.log('Queue bound to direct exchange');
});

// Topic Exchange
const topicExchange = RedisSMQ.createTopicExchange();
topicExchange.bindQueue('user-notifications', 'events', 'user.*', (err) => {
  if (err) console.error('Binding failed:', err);
  else console.log('Queue bound to topic exchange');
});

// Fanout Exchange
const fanoutExchange = RedisSMQ.createFanoutExchange();
fanoutExchange.bindQueue('email-service', 'notifications', (err) => {
  if (err) console.error('Binding failed:', err);
  else console.log('Queue bound to fanout exchange');
});
```

## Exchange Types in Detail

### 1. Direct Exchange

Routes messages to queues with exact routing key matches.

```javascript
'use strict';

// Setup binding
directExchange.bindQueue('payment-processor', 'payments', 'payment.process', callback);

// Send message
const { ProducibleMessage } = require('redis-smq');

const message = new ProducibleMessage()
  .setDirectExchange('payments')
  .setExchangeRoutingKey('payment.process')  // Must match exactly
  .setBody({ amount: 99.99, currency: 'USD' });
```

### 2. Topic Exchange

Routes messages using AMQP-style wildcard patterns:

- '*' matches exactly one word
- '#' matches zero or more words
- Words are separated by dots (.)

```javascript
'use strict';

// Setup bindings with patterns
topicExchange.bindQueue('order-notifications', 'events', 'order.*', callback);
topicExchange.bindQueue('user-analytics', 'events', 'user.#', callback);
topicExchange.bindQueue('audit-log', 'events', '*.created', callback);

// Send message - will match multiple patterns
const { ProducibleMessage } = require('redis-smq');

const message = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('order.created')  // Matches 'order.*' and '*.created'
  .setBody({ orderId: 'ORD-001', customerId: 'CUST-123' });
```

Pattern examples:

| Pattern     | Matches                                       | Does Not Match                 |
|-------------|-----------------------------------------------|--------------------------------|
| order.*     | order.created, order.updated                  | order, order.payment.completed |
| order.#     | order, order.created, order.payment.completed | user.created                   |
| *.created   | order.created, user.created                   | order.updated                  |

### 3. Fanout Exchange

Broadcasts messages to all bound queues, ignoring routing keys.

```javascript
'use strict';

// Setup bindings
fanoutExchange.bindQueue('email-service', 'alerts', callback);
fanoutExchange.bindQueue('sms-service', 'alerts', callback);
fanoutExchange.bindQueue('push-service', 'alerts', callback);

// Send message - goes to all bound queues
const { ProducibleMessage } = require('redis-smq');

const message = new ProducibleMessage()
  .setFanoutExchange('alerts')
  .setBody({ level: 'critical', message: 'System overload detected' });
```

## Producer Integration

```javascript
'use strict';

const { RedisSMQ, ProducibleMessage } = require('redis-smq');

const producer = RedisSMQ.createProducer();

producer.run((err) => {
  if (err) throw err;

  const message = new ProducibleMessage()
    .setTopicExchange('events')
    .setExchangeRoutingKey('user.login')
    .setBody({ userId: 123, timestamp: new Date() });

  producer.produce(message, (produceErr, messageIds) => {
    if (produceErr) {
      if (produceErr.message && produceErr.message.includes('No matching queues')) {
        console.warn('No queues matched routing criteria');
      } else {
        console.error('Failed to produce message:', produceErr);
      }
      return;
    }
    console.log(`Message sent to ${messageIds.length} queue(s):`, messageIds);
  });
});
```

## Exchange Management

### Deleting Exchanges

Important
- An exchange cannot be deleted if it has bound queues. Unbind all queues first.

```javascript
'use strict';

// Check what's bound before deleting
directExchange.getRoutingKeys('orders', (err, keys) => {
  if (err) throw err;

  if (keys.length === 0) {
    // Safe to delete
    directExchange.delete('orders', (delErr) => {
      if (delErr) console.error('Delete failed:', delErr);
      else console.log('Exchange deleted');
    });
  } else {
    console.log('Cannot delete: exchange has bound queues');
    // Unbind queues first, then delete
  }
});
```

### Unbinding Queues

```javascript
'use strict';

// Direct Exchange
directExchange.unbindQueue('queue-name', 'exchange-name', 'routing.key', callback);

// Topic Exchange
topicExchange.unbindQueue('queue-name', 'exchange-name', 'pattern.*', callback);

// Fanout Exchange
fanoutExchange.unbindQueue('queue-name', 'exchange-name', callback);
```

## Best Practices

### 1. When to Use Each Approach

Direct Queue (`setQueue()`) — use for:
- Simple point-to-point messaging
- Known destination queues
- Minimal routing overhead and best performance

Exchanges — use for:
- Multiple destination queues
- Dynamic routing based on content, patterns, or topology that changes without touching producers
- Decoupling producers from consumers

### 2. Naming Conventions

Use hierarchical naming for better routing:

```javascript
// Good: Clear hierarchy
'user.account.created'
'order.payment.completed'
'system.alert.critical'

// Avoid: Flat naming
'user_created'
'payment_done'
'critical_alert'
```

### 3. Setup Strategy

Configure bindings during application startup:

```javascript
'use strict';

async function setupExchanges() {
  const { RedisSMQ } = require('redis-smq');
  const topicExchange = RedisSMQ.createTopicExchange();

  // Setup all bindings
  await bindQueue(topicExchange, 'user-service', 'events', 'user.*');
  await bindQueue(topicExchange, 'order-service', 'events', 'order.*');
  await bindQueue(topicExchange, 'audit-service', 'events', '#');

  console.log('Exchanges configured');
}

function bindQueue(exchange, queue, exchangeName, pattern) {
  return new Promise((resolve, reject) => {
    exchange.bindQueue(queue, exchangeName, pattern, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
```

### 4. Error Handling

```javascript
'use strict';

producer.produce(message, (err, messageIds) => {
  if (err) {
    if (err.message && err.message.includes('No matching queues')) {
      console.warn('No queues matched routing criteria');
    } else {
      console.error('Production failed:', err);
    }
    return;
  }

  console.log(`Message delivered to ${messageIds.length} queue(s)`);
});
```

## Common Patterns

### Event-Driven Architecture

```javascript
'use strict';

// Publisher service
const { ProducibleMessage } = require('redis-smq');

const event = new ProducibleMessage()
  .setTopicExchange('domain-events')
  .setExchangeRoutingKey('user.registered')
  .setBody({
    userId: 123,
    email: 'user@example.com',
    timestamp: new Date()
  });

// Multiple subscribers can bind to:
// - 'user.*' (all user events)
// - '*.registered' (all registration events)
// - '#' (all events)
```

### Multi-Channel Notifications

```javascript
'use strict';

// Setup fanout for broadcasting
const { RedisSMQ, ProducibleMessage } = require('redis-smq');

const fanout = RedisSMQ.createFanoutExchange();
fanout.bindQueue('email-queue', 'user-notifications', callback);
fanout.bindQueue('sms-queue', 'user-notifications', callback);
fanout.bindQueue('push-queue', 'user-notifications', callback);

// Broadcast to all channels
const notification = new ProducibleMessage()
  .setFanoutExchange('user-notifications')
  .setBody({
    userId: 123,
    message: 'Your order has shipped!',
    priority: 'high'
  });
```

## API Reference

- [ExchangeDirect](api/classes/ExchangeDirect.md) - Direct exchange operations
- [ExchangeTopic](api/classes/ExchangeTopic.md) - Topic exchange operations
- [ExchangeFanout](api/classes/ExchangeFanout.md) - Fanout exchange operations
- [ProducibleMessage](api/classes/ProducibleMessage.md) - Message creation and routing
- [Producer](api/classes/Producer.md) - Message production

## Related Documentation

- [Producing Messages](producing-messages.md) - Message production guide
- [Consuming Messages](consuming-messages.md) - Message consumption guide
- [Queues](queues.md) - Queue management
- [Performance](performance.md) - Performance tips (direct queue publishing is the fastest routing path)
