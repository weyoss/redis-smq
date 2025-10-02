[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeTopic

# Class: ExchangeTopic

Topic exchange operations.

This class manages binding, unbinding, matching, and deleting of topic exchanges.
A topic exchange routes messages to queues based on pattern matching between
routing keys and binding patterns using AMQP-style wildcards.

Topic Pattern Syntax:
- Tokens are separated by dots (.)
- '*' matches exactly one token
- '#' matches zero or more tokens
- Literal tokens match exactly

## Example

```typescript
const topicExchange = new ExchangeTopic();

// Bind queue to pattern
topicExchange.bindQueue(
  'order-notifications',
  'orders',
  'order.*.created',
  (err) => { ... }
);

// Match queues for routing key
topicExchange.matchQueues(
  'orders',
  'order.premium.created',
  (err, queues) => { ... }
);
```

## Constructors

### Constructor

> **new ExchangeTopic**(): `ExchangeTopic`

Creates a new ExchangeTopic instance.
The logger is namespaced with the class name for consistent logging context.

#### Returns

`ExchangeTopic`

## Methods

### bindQueue()

> **bindQueue**(`queue`, `exchange`, `routingPattern`, `cb`): `void`

Bind a queue to a topic exchange using a binding pattern.

This method creates a binding between a queue and an exchange using a topic
pattern. Messages published to the exchange with routing keys that match
the pattern will be routed to the bound queue.

Idempotency:
- If the binding already exists, the operation succeeds without changes.

#### Parameters

##### queue

Queue name or parameter object.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchange

Exchange name or parameter object.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### routingPattern

`string`

Topic binding pattern (e.g., 'order.*.created', 'user.#').

##### cb

`ICallback`

Callback invoked when the operation completes.

#### Returns

`void`

#### Throws

QueueNotFoundError via callback if the queue does not exist in the namespace index.

#### Throws

NamespaceMismatchError When namespace mismatch occurs

#### Throws

ExchangeError via callback on invalid binding pattern or exchange type mismatch.

#### Throws

ExchangeError via callback on concurrent modifications.

#### Example

```typescript
// Bind queue to receive all order-related events
topicExchange.bindQueue(
  'order-processor',
  'events',
  'order.#',
  (err) => {
    if (err) {
      console.error('Failed to bind queue:', err);
      return;
    }
    console.log('Queue bound successfully');
  }
);

// Bind queue to receive only creation events for any entity
topicExchange.bindQueue(
  { name: 'audit-log', ns: 'production' },
  { name: 'events', ns: 'production' },
  '*.created',
  (err) => { ... }
);
```

***

### delete()

> **delete**(`exchange`, `cb`): `void`

Delete a topic exchange.

This method removes a topic exchange and all its associated data structures.
The operation is atomic and ensures data consistency across all related Redis keys.

#### Parameters

##### exchange

Exchange name or parameter object.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### cb

`ICallback`

Callback invoked when the exchange is deleted or if an error occurs.

#### Returns

`void`

#### Throws

ExchangeError via callback if exchange is not found or not a topic exchange.

#### Throws

ExchangeHasBoundQueuesError via callback if there are bound queues.

#### Throws

ExchangeError via callback on concurrent modifications.

#### Example

```typescript
// Delete a topic exchange
topicExchange.delete('events', (err) => {
  if (err) {
    if (err instanceof ExchangeHasBoundQueuesError) {
      console.error('Cannot delete exchange: queues are still bound');
    } else {
      console.error('Failed to delete exchange:', err);
    }
    return;
  }
  console.log('Exchange deleted successfully');
});

// Delete with explicit namespace
topicExchange.delete(
  { name: 'notifications', ns: 'production' },
  (err) => { ... }
);
```

***

### getBindingPatternQueues()

> **getBindingPatternQueues**(`bindingPattern`, `exchange`, `cb`): `void`

Retrieve all queues bound to a specific binding pattern within a topic exchange.

This method returns all queues that are bound to the exchange using the
specified binding pattern. This is useful for understanding which queues
will receive messages for routing keys that match the pattern.

#### Parameters

##### bindingPattern

`string`

The binding pattern to query (e.g., 'order.*.created').

##### exchange

Exchange name or parameter object.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Callback invoked with an array of queues bound to the pattern or an error.

#### Returns

`void`

#### Throws

Error via callback on invalid exchange parameters.

#### Throws

Error via callback on Redis operations failure.

#### Example

```typescript
topicExchange.getBindingPatternQueues(
  'user.#',
  'notifications',
  (err, queues) => {
    if (err) {
      console.error('Failed to get pattern queues:', err);
      return;
    }

    console.log(`Queues bound to pattern 'user.#':`);
    queues.forEach(q => {
      console.log(`- ${q.name} in ${q.ns}`);
    });
  }
);
```

***

### getBindingPatterns()

> **getBindingPatterns**(`exchange`, `cb`): `void`

Retrieve all binding patterns registered for a topic exchange.

This method returns all patterns that have been used to bind queues to the
exchange. Each pattern represents a different routing rule that can match
incoming routing keys.

#### Parameters

##### exchange

Exchange name or parameter object.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### cb

`ICallback`\<`string`[]\>

Callback invoked with an array of binding patterns or an error.

#### Returns

`void`

#### Throws

Error via callback on invalid exchange parameters.

#### Throws

Error via callback on Redis operations failure.

#### Example

```typescript
topicExchange.getBindingPatterns('notifications', (err, patterns) => {
  if (err) {
    console.error('Failed to get patterns:', err);
    return;
  }

  console.log('Binding patterns:');
  patterns.forEach(pattern => {
    console.log(`- ${pattern}`);
  });
});
```

***

### matchQueues()

> **matchQueues**(`exchange`, `routingKey`, `cb`): `void`

Resolve queues bound to a topic exchange for a given routing key.

This method performs pattern matching between the routing key and all binding
patterns registered for the exchange. Queues bound to matching patterns are
returned, with duplicates removed (a queue may match multiple patterns).

Pattern Matching Rules:
- 'order.*' matches 'order.created', 'order.updated', but not 'order.item.created'
- 'order.#' matches 'order.created', 'order.item.created', 'order.item.variant.updated'
- 'order.*.created' matches 'order.premium.created', but not 'order.created'

#### Parameters

##### exchange

Exchange name or parameter object.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### routingKey

`string`

Routing key to match against binding patterns.

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Callback invoked with an array of matching queues or an error.

#### Returns

`void`

#### Throws

Error via callback on invalid exchange parameters.

#### Throws

Error via callback on Redis operations failure.

#### Example

```typescript
// Match queues for a specific routing key
topicExchange.matchQueues('notifications', 'user.premium.signup', (err, queues) => {
  if (err) {
    console.error('Failed to match queues:', err);
    return;
  }

  console.log(`Found ${queues.length} matching queues:`);
  queues.forEach(q => {
    console.log(`- ${q.name} in namespace ${q.ns}`);
  });
});
```

***

### unbindQueue()

> **unbindQueue**(`queue`, `exchange`, `routingPattern`, `cb`): `void`

Unbind a queue from a topic exchange binding pattern.

This method removes a binding between a queue and an exchange for a specific
topic pattern. After unbinding, messages matching the pattern will no longer
be routed to the queue.

#### Parameters

##### queue

Queue name or parameter object.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchange

Exchange name or parameter object.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### routingPattern

`string`

Topic binding pattern to unbind.

##### cb

`ICallback`

Callback invoked when the operation completes.

#### Returns

`void`

#### Throws

QueueNotBoundError via callback if the queue is not bound to the pattern.

#### Throws

NamespaceMismatchError When namespace mismatch occurs

#### Throws

ExchangeError via callback on invalid binding pattern or exchange type mismatch.

#### Throws

ExchangeError via callback on concurrency conflicts.

#### Example

```typescript
// Unbind queue from specific pattern
topicExchange.unbindQueue(
  'order-processor',
  'events',
  'order.cancelled',
  (err) => {
    if (err) {
      console.error('Failed to unbind queue:', err);
      return;
    }
    console.log('Queue unbound successfully');
  }
);
```
