[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeDirect

# Class: ExchangeDirect

Direct Exchange implementation for RedisSMQ.

A direct exchange routes messages to queues based on exact routing key matches.
Messages published with a specific routing key are delivered only to queues
bound to that exact routing key. This provides precise message routing control
and is ideal for point-to-point messaging patterns.

Key Features:
- Exact routing key matching for precise message delivery
- Multiple queues can be bound to the same routing key
- Atomic binding and unbinding operations with Redis transactions
- Concurrent modification detection using Redis WATCH
- Namespace isolation for multi-tenant applications
- Automatic cleanup of empty routing keys and reverse indexes
- Comprehensive validation and error handling

Routing Behavior:
- Messages are routed only to queues with matching routing keys
- If no queues match the routing key, the message is not delivered
- Multiple queues can share the same routing key for load distribution
- Routing keys are validated and normalized for Redis compatibility

## Example

```typescript
const directExchange = new ExchangeDirect();

// Bind queues to specific routing keys
directExchange.bindQueue('user-notifications', 'user-events', 'user.created', (err) => {
  if (err) {
    console.error('Failed to bind queue:', err);
    return;
  }
  console.log('Queue bound to routing key successfully');
});

// Find queues matching a routing key
directExchange.matchQueues('user-events', 'user.created', (err, queues) => {
  if (err) {
    console.error('Failed to match queues:', err);
    return;
  }
  console.log('Matching queues:', queues);
});

// Unbind queue from routing key
directExchange.unbindQueue('user-notifications', 'user-events', 'user.created', (err) => {
  if (!err) console.log('Queue unbound successfully');
});
```

## Constructors

### Constructor

> **new ExchangeDirect**(): `ExchangeDirect`

#### Returns

`ExchangeDirect`

## Methods

### bindQueue()

> **bindQueue**(`queue`, `exchange`, `routingKey`, `cb`): `void`

Binds a queue to a direct exchange with a specific routing key.

This method creates a binding between a queue and a direct exchange for a specific
routing key. Messages published to the exchange with this routing key will be
delivered to the bound queue. Multiple queues can be bound to the same routing key
for load distribution or redundancy.

The operation is idempotent - binding the same queue to the same routing key
multiple times will succeed without error.

#### Parameters

##### queue

The queue to bind. Can be a string (queue name) or an object
              with name and namespace properties.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchange

The exchange to bind to. Can be a string (exchange name) or
                 an object with name and namespace properties.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### routingKey

`string`

The routing key for message routing. Must be a valid Redis key
                   format (alphanumeric characters, hyphens, underscores, dots).

##### cb

`ICallback`

Callback function called when the binding operation completes

#### Returns

`void`

#### Throws

When queue parameters are invalid

#### Throws

When exchange parameters are invalid

#### Throws

When the routing key format is invalid

#### Throws

When the specified queue does not exist

#### Throws

When namespace mismatch occurs

#### Throws

When exchange type is invalid
                       or concurrent modifications are detected

#### Throws

When Redis operations fail

#### Example

```typescript
const directExchange = new ExchangeDirect();

// Bind a queue to handle order creation events
directExchange.bindQueue('order-processor', 'order-events', 'order.created', (err) => {
  if (err) {
    if (err instanceof QueueNotFoundError) {
      console.error('Queue order-processor does not exist');
    } else if (err instanceof InvalidDirectExchangeParametersError) {
      console.error('Invalid routing key format');
    } else if (err instanceof ExchangeError) {
      console.error('Exchange error:', err.message);
    } else {
      console.error('Binding failed:', err);
    }
    return;
  }

  console.log('Queue bound to routing key successfully');
});

// Bind with explicit namespaces
directExchange.bindQueue(
  { name: 'email-service', ns: 'production' },
  { name: 'notifications', ns: 'production' },
  'email.send',
  (err) => {
    if (!err) {
      console.log('Production email service bound successfully');
    }
  }
);

// Bind multiple queues to the same routing key for load balancing
const queues = ['worker-1', 'worker-2', 'worker-3'];
queues.forEach((queueName, index) => {
  directExchange.bindQueue(queueName, 'task-exchange', 'task.process', (err) => {
    if (!err) {
      console.log(`Worker ${index + 1} bound to task processing`);
    }
  });
});

// Bind different routing keys to the same queue for multiple event types
const eventTypes = ['user.created', 'user.updated', 'user.deleted'];
eventTypes.forEach(eventType => {
  directExchange.bindQueue('user-audit-log', 'user-events', eventType, (err) => {
    if (!err) {
      console.log(`Audit log bound to ${eventType} events`);
    }
  });
});
```

***

### delete()

> **delete**(`exchange`, `cb`): `void`

Deletes a direct exchange from the system.

This method performs a comprehensive and safe deletion of a direct exchange with
extensive validation and cleanup. The deletion process ensures data integrity
and prevents orphaned data structures in Redis.

#### Parameters

##### exchange

The exchange identifier. Can be a string (exchange name) or
                 an object with name and namespace properties.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### cb

`ICallback`

Callback function called when the deletion completes

#### Returns

`void`

#### Throws

When exchange parameters are invalid

#### Throws

When the exchange is not found, is not a direct exchange,
                       or concurrent modifications are detected

#### Throws

When the exchange still has bound queues

#### Throws

When Redis operations fail

#### Example

```typescript
const directExchange = new ExchangeDirect();

// Delete an exchange (must have no bound queues)
directExchange.delete('old-order-events', (err) => {
  if (err) {
    if (err instanceof ExchangeHasBoundQueuesError) {
      console.error('Cannot delete: exchange has bound queues');
      // Need to unbind all queues first
      console.log('Unbind all queues before deletion');
    } else if (err instanceof ExchangeError) {
      console.error('Exchange not found or invalid type');
    } else {
      console.error('Deletion failed:', err);
    }
    return;
  }

  console.log('Exchange deleted successfully');
});

// Delete exchange with specific namespace
directExchange.delete(
  { name: 'temp-exchange', ns: 'testing' },
  (err) => {
    if (!err) {
      console.log('Testing exchange deleted');
    }
  }
);

// Safe deletion workflow: unbind all queues first
async function safeDeleteExchange(exchangeName) {
  // First, get all routing keys and their bound queues
  const routingKeys = ['order.created', 'order.updated', 'order.deleted'];

  // Unbind all queues from all routing keys
  for (const routingKey of routingKeys) {
    directExchange.matchQueues(exchangeName, routingKey, (err, queues) => {
      if (!err && queues.length > 0) {
        queues.forEach(queue => {
          directExchange.unbindQueue(queue, exchangeName, routingKey, (unbindErr) => {
            if (unbindErr) {
              console.error(`Failed to unbind ${queue.name}:`, unbindErr);
            }
          });
        });
      }
    });
  }

  // Wait a moment for unbinding to complete, then delete
  setTimeout(() => {
    directExchange.delete(exchangeName, (deleteErr) => {
      if (!deleteErr) {
        console.log('Exchange safely deleted');
      }
    });
  }, 1000);
}

// Delete during application shutdown
process.on('SIGTERM', () => {
  directExchange.delete('app-events', (err) => {
    if (err) {
      console.error('Failed to delete exchange during shutdown:', err);
    }
    process.exit(err ? 1 : 0);
  });
});
```

***

### getRoutingKeyQueues()

> **getRoutingKeyQueues**(`exchange`, `routingKey`, `cb`): `void`

Retrieves all queues bound to a specific routing key for a direct exchange.

#### Parameters

##### exchange

Exchange identifier. Either the exchange name as a string
                  or an object with explicit namespace and name: { ns, name }.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### routingKey

`string`

Routing key to resolve. The key is validated and normalized to lowercase.

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Node.js-style callback invoked with the list of queues bound under the routing key.

#### Returns

`void`

#### Throws

When exchange parameters are invalid

#### Throws

When the routing key format is invalid

#### Throws

When Redis operations fail

#### Example

```typescript
// Using exchange name
getRoutingKeyQueues('orders', 'created', (err, queues) => {
  if (err) { // handle error }
  // queues is IQueueParams[]: [{ ns: 'prod', name: 'shipping' }, ...]
});
// Using explicit namespace and name
getRoutingKeyQueues({ ns: 'prod', name: 'orders' }, 'updated', (err, queues) => {
  if (err) { // handle error }
  // queues is IQueueParams[]
});
```

***

### getRoutingKeys()

> **getRoutingKeys**(`exchange`, `cb`): `void`

Retrieve all routing keys currently bound to a direct exchange.

#### Parameters

##### exchange

Exchange identifier. Either the exchange name as a string
                 or an object with explicit namespace and name: { ns, name }.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### cb

`ICallback`\<`string`[]\>

Node.js-style callback invoked with the list of routing keys bound to the exchange.

#### Returns

`void`

#### Throws

When exchange parameters are invalid

#### Throws

When Redis operations fail

#### Example

```typescript
// Using exchange name (namespace resolved internally)
getRoutingKeys('orders', (err, keys) => {
  if (err) console.error(err);
  // keys is string[]
});

// Using explicit namespace and name
getRoutingKeys({ ns: 'prod', name: 'orders' }, (err, keys) => {
  if (err) console.error(err);
  // keys is string[]
});
```

***

### matchQueues()

> **matchQueues**(`exchange`, `routingKey`, `cb`): `void`

Retrieves all queues bound to the specified routing key in a direct exchange.

This method performs an exact match lookup for the given routing key and returns
all queues that are bound to it. In direct exchanges, only queues with exact
routing key matches will receive messages, making this method essential for
understanding message routing behavior.

#### Parameters

##### exchange

The exchange identifier. Can be a string (exchange name) or
                 an object with name and namespace properties. If namespace is
                 not specified, the default namespace from configuration is used.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### routingKey

`string`

The routing key to match against. Must be a valid Redis key
                   format (alphanumeric characters, hyphens, underscores, dots).

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Callback function called with the list of matching queues or an error

#### Returns

`void`

#### Throws

When exchange parameters are invalid

#### Throws

When the routing key format is invalid

#### Throws

When the exchange is not found or is not a direct exchange

#### Throws

When Redis returns an unexpected empty response

#### Throws

When Redis operations fail

#### Example

```typescript
const directExchange = new ExchangeDirect();

// Match queues for a specific routing key
directExchange.matchQueues('order-events', 'order.created', (err, queues) => {
  if (err) {
    if (err instanceof InvalidDirectExchangeParametersError) {
      console.error('Invalid routing key format');
    } else if (err instanceof ExchangeError) {
      console.error('Exchange not found or wrong type');
    } else {
      console.error('Failed to match queues:', err);
    }
    return;
  }

  console.log(`Found ${queues.length} queues for routing key 'order.created':`);
  queues.forEach(queue => {
    console.log(`- Queue: ${queue.name} (namespace: ${queue.ns})`);
  });
});

// Match with explicit namespace
directExchange.matchQueues(
  { name: 'user-events', ns: 'production' },
  'user.login',
  (err, queues) => {
    if (!err) {
      console.log('Production queues for user.login:', queues);
    }
  }
);

// Handle case with no matching queues
directExchange.matchQueues('notifications', 'sms.send', (err, queues) => {
  if (!err) {
    if (queues.length === 0) {
      console.log('No queues bound to routing key sms.send');
    } else {
      console.log('SMS queues found:', queues);
    }
  }
});
```

***

### unbindQueue()

> **unbindQueue**(`queue`, `exchange`, `routingKey`, `cb`): `void`

Unbinds a queue from a direct exchange for a specific routing key.

This method removes the binding between a queue and a direct exchange for the
specified routing key. After unbinding, messages published to the exchange with
this routing key will no longer be delivered to the unbound queue. Other queues
bound to the same routing key will continue to receive messages.

#### Parameters

##### queue

The queue to unbind. Can be a string (queue name) or an object
              with name and namespace properties.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchange

The exchange to unbind from. Can be a string (exchange name) or
                 an object with name and namespace properties.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### routingKey

`string`

The routing key to unbind from. Must match the exact routing key
                   used during binding.

##### cb

`ICallback`

Callback function called when the unbinding operation completes

#### Returns

`void`

#### Throws

When queue parameters are invalid

#### Throws

When exchange parameters are invalid

#### Throws

When the routing key format is invalid

#### Throws

When namespace mismatch occurs

#### Throws

When exchange type is invalid
                       exchange is not found, or concurrent modifications are detected

#### Throws

When the queue is not currently bound to the routing key

#### Throws

When Redis operations fail

#### Example

```typescript
const directExchange = new ExchangeDirect();

// Unbind a queue from a specific routing key
directExchange.unbindQueue('order-processor', 'order-events', 'order.created', (err) => {
  if (err) {
    if (err instanceof QueueNotBoundError) {
      console.error('Queue is not bound to this routing key');
    } else if (err instanceof InvalidDirectExchangeParametersError) {
      console.error('Invalid routing key format');
    } else if (err instanceof ExchangeError) {
      console.error('Exchange error:', err.message);
    } else {
      console.error('Unbinding failed:', err);
    }
    return;
  }

  console.log('Queue unbound from routing key successfully');
});

// Unbind with explicit namespaces
directExchange.unbindQueue(
  { name: 'email-service', ns: 'production' },
  { name: 'notifications', ns: 'production' },
  'email.send',
  (err) => {
    if (!err) {
      console.log('Production email service unbound successfully');
    }
  }
);

// Unbind multiple queues from the same routing key
const queues = ['worker-1', 'worker-2', 'worker-3'];
queues.forEach((queueName, index) => {
  directExchange.unbindQueue(queueName, 'task-exchange', 'task.process', (err) => {
    if (!err) {
      console.log(`Worker ${index + 1} unbound from task processing`);
    }
  });
});

// Unbind a queue from multiple routing keys
const eventTypes = ['user.created', 'user.updated', 'user.deleted'];
eventTypes.forEach(eventType => {
  directExchange.unbindQueue('user-audit-log', 'user-events', eventType, (err) => {
    if (!err) {
      console.log(`Audit log unbound from ${eventType} events`);
    }
  });
});

// Handle graceful service shutdown
function shutdownService() {
  directExchange.unbindQueue('my-service', 'app-events', 'service.task', (err) => {
    if (err) {
      console.error('Failed to unbind during shutdown:', err);
    } else {
      console.log('Service unbound, safe to shutdown');
      process.exit(0);
    }
  });
}
```
