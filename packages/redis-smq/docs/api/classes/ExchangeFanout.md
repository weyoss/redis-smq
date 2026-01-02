[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanout

# Class: ExchangeFanout

Fanout Exchange implementation for RedisSMQ.

A fanout exchange routes messages to all queues that are bound to it, ignoring routing keys.
This is useful for broadcasting messages to multiple consumers or implementing pub/sub patterns.

Features:

- Message broadcasting to all bound queues
- Atomic queue binding and unbinding operations
- Concurrent modification detection using Redis WATCH
- Namespace isolation for multi-tenant applications
- Comprehensive error handling and validation

## Example

```typescript
const fanoutExchange = new ExchangeFanout();

// Bind queues to the exchange
fanoutExchange.bindQueue('notifications', 'broadcast-exchange', (err) => {
  if (err) {
    console.error('Failed to bind queue:', err);
    return;
  }
  console.log('Queue bound successfully');
});

// Get all bound queues
fanoutExchange.matchQueues('broadcast-exchange', (err, queues) => {
  if (err) {
    console.error('Failed to get bound queues:', err);
    return;
  }
  console.log('Bound queues:', queues);
});
```

## Constructors

### Constructor

> **new ExchangeFanout**(): `ExchangeFanout`

#### Returns

`ExchangeFanout`

## Methods

### bindQueue()

> **bindQueue**(`queue`, `exchange`, `cb`): `void`

Binds a queue to a fanout exchange.

This method creates a binding between a queue and a fanout exchange, enabling
messages published to the exchange to be delivered to the bound queue. In fanout
exchanges, all bound queues receive copies of every message, regardless of routing keys.

#### Parameters

##### queue

The queue to bind. Can be a string (queue name) or an object
with name and namespace properties.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchange

The exchange to bind to. Can be a string (exchange name) or
an object with name and namespace properties.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### cb

`ICallback`

Callback function called when the binding operation completes

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

InvalidExchangeParametersError

#### Throws

QueueNotFoundError

#### Throws

ExchangeNotFoundError

#### Throws

NamespaceMismatchError

#### Throws

ExchangeTypeMismatchError

#### Throws

ExchangeQueuePolicyMismatchError

#### Example

```typescript
const fanoutExchange = new ExchangeFanout();

// Bind a queue to an exchange (both in default namespace)
fanoutExchange.bindQueue('email-notifications', 'user-events', (err) => {
  if (err) {
    if (err instanceof QueueNotFoundError) {
      console.error('Queue does not exist');
    } else if (err instanceof ExchangeError) {
      console.error('Exchange error:', err.message);
    } else {
      console.error('Binding failed:', err);
    }
    return;
  }

  console.log('Queue bound to exchange successfully');
});

// Bind with explicit namespace specification
fanoutExchange.bindQueue(
  { name: 'sms-notifications', ns: 'production' },
  { name: 'user-events', ns: 'production' },
  (err) => {
    if (!err) {
      console.log('Production queue bound successfully');
    }
  },
);

// Multiple queues can be bound to the same fanout exchange
const queues = ['email-queue', 'sms-queue', 'push-queue'];
queues.forEach((queueName) => {
  fanoutExchange.bindQueue(queueName, 'notification-fanout', (err) => {
    if (!err) console.log(`${queueName} bound to fanout exchange`);
  });
});
```

---

### create()

> **create**(`exchange`, `queuePolicy`, `cb`): `void`

#### Parameters

##### exchange

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### queuePolicy

[`EExchangeQueuePolicy`](../enumerations/EExchangeQueuePolicy.md)

##### cb

`ICallback`

#### Returns

`void`

---

### delete()

> **delete**(`exchange`, `cb`): `void`

Deletes a fanout exchange from the system.

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

InvalidExchangeParametersError

#### Throws

ExchangeHasBoundQueuesError

#### Throws

ExchangeNotFoundError

#### Throws

ExchangeTypeMismatchError

#### Example

```typescript
const fanoutExchange = new ExchangeFanout();

// Delete an exchange (must have no bound queues)
fanoutExchange.delete('old-broadcast-exchange', (err) => {
  if (err) {
    if (err instanceof ExchangeHasBoundQueuesError) {
      console.error('Cannot delete: exchange has bound queues');
      // Unbind all queues first, then retry deletion
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
fanoutExchange.delete({ name: 'temp-exchange', ns: 'testing' }, (err) => {
  if (!err) console.log('Testing exchange deleted');
});
```

---

### matchQueues()

> **matchQueues**(`exchange`, `cb`): `void`

Retrieves all queues bound to the specified fanout exchange.

This method returns all queues that are currently bound to the fanout exchange.
In a fanout exchange, messages are delivered to all bound queues regardless
of routing keys, making this method useful for understanding message distribution.

#### Parameters

##### exchange

The exchange identifier. Can be a string (exchange name) or
an object with name and namespace properties. If namespace is
not specified, the default namespace from configuration is used.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Callback function called with the list of bound queues or an error

#### Returns

`void`

#### Throws

InvalidExchangeParametersError

#### Example

```typescript
const fanoutExchange = new ExchangeFanout();

// Get bound queues using exchange name
fanoutExchange.matchQueues('broadcast-exchange', (err, queues) => {
  if (err) {
    console.error('Failed to get bound queues:', err);
    return;
  }

  console.log(`Found ${queues.length} bound queues:`);
  queues.forEach((queue) => {
    console.log(`- Queue: ${queue.name} (namespace: ${queue.ns})`);
  });
});

// Get bound queues using exchange object with namespace
fanoutExchange.matchQueues(
  { name: 'broadcast-exchange', ns: 'production' },
  (err, queues) => {
    if (!err) {
      console.log('Production queues:', queues);
    }
  },
);
```

---

### unbindQueue()

> **unbindQueue**(`queue`, `exchange`, `cb`): `void`

Unbinds a queue from a fanout exchange.

This method removes the binding between a queue and a fanout exchange, stopping
message delivery from the exchange to the specified queue. Other queues bound
to the same exchange will continue to receive messages.

Note: This operation does not delete the exchange or queue, only removes their binding.

#### Parameters

##### queue

The queue to unbind. Can be a string (queue name) or an object
with name and namespace properties.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchange

The exchange to unbind from. Can be a string (exchange name) or
an object with name and namespace properties.

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### cb

`ICallback`

Callback function called when the unbinding operation completes

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

InvalidExchangeParametersError

#### Throws

NamespaceMismatchError

#### Throws

ExchangeNotFoundError

#### Throws

ExchangeTypeMismatchError

#### Throws

QueueNotBoundError

#### Example

```typescript
const fanoutExchange = new ExchangeFanout();

// Unbind a queue from an exchange
fanoutExchange.unbindQueue('email-notifications', 'user-events', (err) => {
  if (err) {
    if (err instanceof ExchangeError) {
      console.error('Exchange error:', err.message);
    } else {
      console.error('Unbinding failed:', err);
    }
    return;
  }

  console.log('Queue unbound from exchange successfully');
});

// Unbind with explicit namespace specification
fanoutExchange.unbindQueue(
  { name: 'sms-notifications', ns: 'production' },
  { name: 'user-events', ns: 'production' },
  (err) => {
    if (!err) {
      console.log('Production queue unbound successfully');
    }
  },
);

// Unbind multiple queues from the same exchange
const queuesToUnbind = ['temp-queue-1', 'temp-queue-2'];
queuesToUnbind.forEach((queueName) => {
  fanoutExchange.unbindQueue(queueName, 'broadcast-exchange', (err) => {
    if (!err) console.log(`${queueName} unbound from exchange`);
  });
});
```
