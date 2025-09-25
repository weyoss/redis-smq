[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanout

# Class: ExchangeFanout

Fanout Exchange implementation for RedisSMQ.

A fanout exchange routes messages to all queues bound to it, regardless of routing keys.
This is useful for broadcasting messages to multiple consumers. All bound queues must
have the same queue type to ensure compatibility.

Key features:

- Broadcasts messages to all bound queues
- Enforces queue type consistency across bound queues
- Supports atomic bind/unbind operations
- Prevents deletion when queues are still bound

## Example

```typescript
const fanoutExchange = new ExchangeFanout();

// Save the exchange
fanoutExchange.saveExchange('notifications', (err) => {
  if (err) console.error('Failed to save exchange:', err);
});

// Bind queues to the exchange
fanoutExchange.bindQueue('email-queue', 'notifications', (err) => {
  if (err) console.error('Failed to bind queue:', err);
});

// Get all bound queues
fanoutExchange.getQueues('notifications', (err, queues) => {
  if (err) console.error('Error:', err);
  else console.log('Bound queues:', queues);
});
```

## Extends

- `ExchangeAbstract`\<`string`\>

## Constructors

### Constructor

> **new ExchangeFanout**(): `ExchangeFanout`

Creates a new ExchangeFanout instance.

Initializes the fanout exchange with logging capabilities.

#### Returns

`ExchangeFanout`

#### Overrides

`ExchangeAbstract<string>.constructor`

## Methods

### bindQueue()

> **bindQueue**(`queue`, `exchangeParams`, `cb`): `void`

Binds a queue to a fanout exchange.

This operation ensures that:

- The queue exists and is accessible
- All queues bound to the same exchange have the same queue type
- The binding is atomic using Redis WATCH/MULTI/EXEC
- If the queue was previously bound to another exchange, it's unbound first

#### Parameters

##### queue

The queue to bind (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchangeParams

`string`

The name of the fanout exchange

##### cb

`ICallback`\<`void`\>

Callback function that receives an error if the operation fails

#### Returns

`void`

#### Example

```typescript
const exchange = new ExchangeFanout();

// Bind using queue name (uses default namespace)
exchange.bindQueue('email-queue', 'notifications', (err) => {
  if (err) console.error('Failed to bind queue:', err);
});

// Bind using queue parameters with custom namespace
exchange.bindQueue(
  { name: 'sms-queue', ns: 'messaging' },
  'notifications',
  (err) => {
    if (err) {
      if (err instanceof QueueDeliveryModelMismatchError) {
        console.error('Queue type mismatch with existing bound queues');
      } else {
        console.error('Failed to bind queue:', err);
      }
    }
  }
);
```

#### Throws

When the queue parameters are invalid

#### Throws

When the exchange name is invalid

#### Throws

When the specified queue doesn't exist

#### Throws

When queue type doesn't match existing bound queues

#### Throws

When Redis connection or binding operations fail

***

### deleteExchange()

> **deleteExchange**(`exchangeParams`, `cb`): `void`

Deletes a fanout exchange.

The exchange can only be deleted if no queues are currently bound to it.
This operation is atomic and uses Redis WATCH/MULTI/EXEC for consistency.

#### Parameters

##### exchangeParams

`string`

The name of the fanout exchange to delete

##### cb

`ICallback`\<`void`\>

Callback function that receives an error if the operation fails

#### Returns

`void`

#### Example

```typescript
const exchange = new ExchangeFanout();

exchange.deleteExchange('old-notifications', (err) => {
  if (err) {
    if (err instanceof ExchangeHasBoundQueuesError) {
      console.error('Cannot delete: exchange has bound queues');
    } else {
      console.error('Failed to delete exchange:', err);
    }
  } else {
    console.log('Exchange deleted successfully');
  }
});
```

#### Throws

When the exchange name is invalid

#### Throws

When the exchange still has bound queues

#### Throws

When Redis connection or deletion operations fail

***

### getAllExchanges()

> **getAllExchanges**(`cb`): `void`

Retrieves all existing fanout exchanges.

#### Parameters

##### cb

`ICallback`\<`string`[]\>

Callback function that receives the list of exchange names or an error

#### Returns

`void`

#### Example

```typescript
const exchange = new ExchangeFanout();

exchange.getAllExchanges((err, exchanges) => {
  if (err) {
    console.error('Failed to get exchanges:', err);
  } else {
    console.log('Available exchanges:', exchanges);
    // exchanges = ['notifications', 'user-events', 'system-alerts']
  }
});
```

#### Throws

When Redis connection or scan operations fail

***

### getQueueExchange()

> **getQueueExchange**(`queue`, `cb`): `void`

Gets the fanout exchange that a queue is bound to.

#### Parameters

##### queue

The queue to check (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`null` \| `string`\>

Callback function that receives the exchange name or null if not bound

#### Returns

`void`

#### Example

```typescript
const exchange = new ExchangeFanout();

// Check using queue name
exchange.getQueueExchange('email-queue', (err, exchangeName) => {
  if (err) {
    console.error('Failed to get queue exchange:', err);
  } else if (exchangeName) {
    console.log(`Queue is bound to exchange: ${exchangeName}`);
  } else {
    console.log('Queue is not bound to any exchange');
  }
});

// Check using queue parameters
exchange.getQueueExchange(
  { name: 'sms-queue', ns: 'messaging' },
  (err, exchangeName) => {
    if (err) console.error('Error:', err);
    else console.log('Exchange:', exchangeName || 'none');
  }
);
```

#### Throws

When the queue parameters are invalid

#### Throws

When the specified queue doesn't exist

#### Throws

When Redis connection or query operations fail

***

### getQueues()

> **getQueues**(`exchangeParams`, `cb`): `void`

Retrieves all queues bound to the specified fanout exchange.

#### Parameters

##### exchangeParams

`string`

The name of the fanout exchange

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Callback function that receives the bound queues or an error

#### Returns

`void`

#### Example

```typescript
const exchange = new ExchangeFanout();

exchange.getQueues('notifications', (err, queues) => {
  if (err) {
    console.error('Failed to get queues:', err);
  } else {
    console.log('Bound queues:', queues);
    // queues = [{ name: 'email-queue', ns: 'default' }, { name: 'sms-queue', ns: 'default' }]
  }
});
```

#### Throws

When the exchange name is invalid

#### Throws

When Redis connection or query operations fail

#### Overrides

`ExchangeAbstract.getQueues`

***

### saveExchange()

> **saveExchange**(`exchangeParams`, `cb`): `void`

Creates and saves a new fanout exchange.

The exchange name must be a valid Redis key. Once saved, queues can be bound to this exchange.

#### Parameters

##### exchangeParams

`string`

The name of the fanout exchange to create

##### cb

`ICallback`\<`void`\>

Callback function that receives an error if the operation fails

#### Returns

`void`

#### Example

```typescript
const exchange = new ExchangeFanout();

exchange.saveExchange('user-notifications', (err) => {
  if (err) {
    console.error('Failed to save exchange:', err);
  } else {
    console.log('Exchange saved successfully');
  }
});
```

#### Throws

When the exchange name is invalid

#### Throws

When Redis connection or storage operations fail

***

### unbindQueue()

> **unbindQueue**(`queue`, `exchangeParams`, `cb`): `void`

Unbinds a queue from a fanout exchange.

This operation verifies that the queue is actually bound to the specified exchange
before removing the binding. The operation is atomic using Redis WATCH/MULTI/EXEC.

#### Parameters

##### queue

The queue to unbind (string name or IQueueParams object)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchangeParams

`string`

The name of the fanout exchange

##### cb

`ICallback`\<`void`\>

Callback function that receives an error if the operation fails

#### Returns

`void`

#### Example

```typescript
const exchange = new ExchangeFanout();

// Unbind using queue name
exchange.unbindQueue('email-queue', 'notifications', (err) => {
  if (err) {
    if (err instanceof QueueNotBoundError) {
      console.error('Queue is not bound to this exchange');
    } else {
      console.error('Failed to unbind queue:', err);
    }
  }
});

// Unbind using queue parameters
exchange.unbindQueue(
  { name: 'sms-queue', ns: 'messaging' },
  'notifications',
  (err) => {
    if (err) console.error('Failed to unbind queue:', err);
  }
);
```

#### Throws

When the queue parameters are invalid

#### Throws

When the exchange name is invalid

#### Throws

When the specified queue doesn't exist

#### Throws

When the queue is not bound to the specified exchange

#### Throws

When Redis connection or unbinding operations fail
