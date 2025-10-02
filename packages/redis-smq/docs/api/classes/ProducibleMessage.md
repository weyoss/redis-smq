[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducibleMessage

# Class: ProducibleMessage

The ProducibleMessage class is a core component of the Redis Simple Message Queue (RedisSMQ) library, designed to
encapsulate the properties and behaviors of a message that can be produced and consumed within the messaging system.
This class provides methods to set and retrieve various message attributes, such as TTL, retry policies, scheduling
options, and more.

## Example

```typescript
const message = new ProducibleMessage()
  .setBody({ userId: 123, action: 'process' })
  .setTTL(60000)
  .setRetryThreshold(5)
  .setPriority(EMessagePriority.HIGH);
```

## Constructors

### Constructor

> **new ProducibleMessage**(): `ProducibleMessage`

Constructs a new ProducibleMessage instance with default consume options.

#### Returns

`ProducibleMessage`

#### Example

```typescript
const message = new ProducibleMessage();
console.log(message.getTTL()); // 0
console.log(message.getRetryThreshold()); // 3
```

## Methods

### disablePriority()

> **disablePriority**(): `ProducibleMessage`

Removes the priority setting from the message.

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Example

```typescript
const message = new ProducibleMessage()
  .setPriority(EMessagePriority.HIGH)
  .disablePriority();

console.log(message.hasPriority()); // false
```

#### See

 - [setPriority](#setpriority)
 - [hasPriority](#haspriority)

***

### getBody()

> **getBody**(): `unknown`

Gets the message payload.

#### Returns

`unknown`

The message payload

#### Example

```typescript
const message = new ProducibleMessage().setBody({ userId: 123 });
console.log(message.getBody()); // { userId: 123 }
```

#### See

[setBody](#setbody)

***

### getConsumeTimeout()

> **getConsumeTimeout**(): `number`

Gets the consumption timeout for the message.

#### Returns

`number`

Timeout in milliseconds (0 means no timeout)

#### Example

```typescript
const message = new ProducibleMessage().setConsumeTimeout(120000);
console.log(message.getConsumeTimeout()); // 120000
```

#### See

[setConsumeTimeout](#setconsumetimeout)

***

### getCreatedAt()

> **getCreatedAt**(): `number`

Gets the timestamp when the message was created.

#### Returns

`number`

Unix timestamp in milliseconds when the message was created

#### Example

```typescript
const message = new ProducibleMessage();
const createdTime = message.getCreatedAt();
console.log(new Date(createdTime)); // Current date/time
```

***

### getExchange()

> **getExchange**(): `null` \| [`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)

Gets the current exchange configuration.

#### Returns

`null` \| [`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md)

Exchange parameters, or null if not set

#### Example

```typescript
const message = new ProducibleMessage().setTopicExchange('events');
const exchange = message.getExchange();
console.log(exchange?.name); // 'events'
console.log(exchange?.type); // EExchangeType.TOPIC
```

#### See

 - [setTopicExchange](#settopicexchange)
 - [setDirectExchange](#setdirectexchange)
 - [setFanoutExchange](#setfanoutexchange)

***

### getExchangeRoutingKey()

> **getExchangeRoutingKey**(): `null` \| `string`

Gets the current exchange routing key.

#### Returns

`null` \| `string`

The routing key, or null if not set

#### Example

```typescript
const message = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.created');

console.log(message.getExchangeRoutingKey()); // 'user.created'
```

#### See

[setExchangeRoutingKey](#setexchangeroutingkey)

***

### getPriority()

> **getPriority**(): `null` \| [`EMessagePriority`](../enumerations/EMessagePriority.md)

Gets the priority level of the message.

#### Returns

`null` \| [`EMessagePriority`](../enumerations/EMessagePriority.md)

Priority level, or null if not set

#### Example

```typescript
const message = new ProducibleMessage().setPriority(EMessagePriority.HIGH);
console.log(message.getPriority()); // EMessagePriority.HIGH
```

#### See

[setPriority](#setpriority)

***

### getQueue()

> **getQueue**(): `null` \| [`IQueueParams`](../interfaces/IQueueParams.md)

Gets the current target queue configuration.

#### Returns

`null` \| [`IQueueParams`](../interfaces/IQueueParams.md)

Queue parameters, or null if not set

#### Example

```typescript
const message = new ProducibleMessage().setQueue('my-queue');
const queue = message.getQueue();
console.log(queue?.name); // 'my-queue'
```

#### See

[setQueue](#setqueue)

***

### getRetryDelay()

> **getRetryDelay**(): `number`

Gets the retry delay for the message.

#### Returns

`number`

Delay between retry attempts in milliseconds

#### Example

```typescript
const message = new ProducibleMessage().setRetryDelay(30000);
console.log(message.getRetryDelay()); // 30000
```

#### See

[setRetryDelay](#setretrydelay)

***

### getRetryThreshold()

> **getRetryThreshold**(): `number`

Gets the retry threshold for the message.

#### Returns

`number`

Maximum number of retry attempts

#### Example

```typescript
const message = new ProducibleMessage().setRetryThreshold(5);
console.log(message.getRetryThreshold()); // 5
```

#### See

[setRetryThreshold](#setretrythreshold)

***

### getScheduledCRON()

> **getScheduledCRON**(): `null` \| `string`

Gets the CRON expression for scheduled message delivery.

#### Returns

`null` \| `string`

CRON expression, or null if not set

#### Example

```typescript
const message = new ProducibleMessage().setScheduledCRON('0 0 10 * * *');
console.log(message.getScheduledCRON()); // '0 0 10 * * *'
```

#### See

[setScheduledCRON](#setscheduledcron)

***

### getScheduledDelay()

> **getScheduledDelay**(): `null` \| `number`

Gets the scheduled delay for message delivery.

#### Returns

`null` \| `number`

The scheduled delay in milliseconds, or null if not set

#### Example

```typescript
const message = new ProducibleMessage().setScheduledDelay(5000);
console.log(message.getScheduledDelay()); // 5000
```

#### See

[setScheduledDelay](#setscheduleddelay)

***

### getScheduledRepeat()

> **getScheduledRepeat**(): `number`

Gets the number of times the message is scheduled to repeat.

#### Returns

`number`

Number of repetitions (0 means no repetition)

#### Example

```typescript
const message = new ProducibleMessage().setScheduledRepeat(3);
console.log(message.getScheduledRepeat()); // 3
```

#### See

[setScheduledRepeat](#setscheduledrepeat)

***

### getScheduledRepeatPeriod()

> **getScheduledRepeatPeriod**(): `null` \| `number`

Gets the scheduled repeat period for the message.

#### Returns

`null` \| `number`

Repeat period in milliseconds, or null if not set

#### Example

```typescript
const message = new ProducibleMessage().setScheduledRepeatPeriod(60000);
console.log(message.getScheduledRepeatPeriod()); // 60000
```

#### See

[setScheduledRepeatPeriod](#setscheduledrepeatperiod)

***

### getTTL()

> **getTTL**(): `number`

Gets the Time-To-Live (TTL) value for the message.

#### Returns

`number`

TTL in milliseconds (0 means no expiration)

#### Example

```typescript
const message = new ProducibleMessage().setTTL(300000);
console.log(message.getTTL()); // 300000
```

#### See

[setTTL](#setttl)

***

### hasPriority()

> **hasPriority**(): `boolean`

Checks if a priority level has been set for the message.

#### Returns

`boolean`

True if priority is set, false otherwise

#### Example

```typescript
const message = new ProducibleMessage();
console.log(message.hasPriority()); // false

message.setPriority(EMessagePriority.HIGH);
console.log(message.hasPriority()); // true
```

#### See

[setPriority](#setpriority)

***

### resetScheduledParams()

> **resetScheduledParams**(): `ProducibleMessage`

Resets all scheduled parameters to their default values.

Clears CRON expression, delay, repeat period, and repeat count.

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Example

```typescript
const message = new ProducibleMessage()
  .setScheduledCRON('0 0 10 * * *')
  .setScheduledRepeat(5)
  .resetScheduledParams(); // All scheduling cleared

console.log(message.getScheduledCRON()); // null
console.log(message.getScheduledRepeat()); // 0
```

***

### setBody()

> **setBody**(`body`): `ProducibleMessage`

Sets the message payload.

The payload will be JSON-serialized when the message is sent.

#### Parameters

##### body

`unknown`

The message payload (any JSON-serializable value)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Example

```typescript
const message = new ProducibleMessage()
  .setBody({
    userId: 123,
    action: 'send-email',
    data: { email: 'user@example.com' }
  });
```

#### See

[getBody](#getbody)

***

### setConsumeTimeout()

> **setConsumeTimeout**(`timeout`): `ProducibleMessage`

Sets the consumption timeout for the message.

If a consumer takes longer than this timeout to process the message,
the message will be considered failed and may be retried.

#### Parameters

##### timeout

`number`

Timeout in milliseconds (0 means no timeout)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When the timeout is not a valid non-negative number

#### Example

```typescript
const message = new ProducibleMessage()
  .setConsumeTimeout(30000) // 30 second timeout
  .setBody({ complexTask: true });
```

#### See

[getConsumeTimeout](#getconsumetimeout)

***

### setDirectExchange()

> **setDirectExchange**(`exchange`): `ProducibleMessage`

Sets a direct exchange for message routing.

Direct exchanges route messages to queues with matching routing keys.

#### Parameters

##### exchange

Exchange name or parameters

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When exchange parameters are invalid

#### Example

```typescript
const message = new ProducibleMessage()
  .setDirectExchange('tasks')
  .setExchangeRoutingKey('high-priority')
  .setBody({ task: 'urgent-task' });
```

#### See

 - [setExchangeRoutingKey](#setexchangeroutingkey)
 - [setFanoutExchange](#setfanoutexchange)
 - [setTopicExchange](#settopicexchange)

***

### setExchangeRoutingKey()

> **setExchangeRoutingKey**(`routingKey`): `ProducibleMessage`

Sets the routing key for exchange-based message delivery.

#### Parameters

##### routingKey

`string`

The routing key for message routing

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When no exchange has been set

#### Example

```typescript
const message = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.login.success');
```

#### See

 - [getExchangeRoutingKey](#getexchangeroutingkey)
 - [setTopicExchange](#settopicexchange)
 - [setDirectExchange](#setdirectexchange)

***

### setFanoutExchange()

> **setFanoutExchange**(`exchange`): `ProducibleMessage`

Sets a fanout exchange for message routing.

Fanout exchanges deliver messages to all bound queues, ignoring routing keys.

#### Parameters

##### exchange

Exchange name or parameters

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When exchange parameters are invalid

#### Example

```typescript
const message = new ProducibleMessage()
  .setFanoutExchange('notifications')
  .setBody({ type: 'broadcast' });
```

#### See

 - [setTopicExchange](#settopicexchange)
 - [setDirectExchange](#setdirectexchange)

***

### setPriority()

> **setPriority**(`priority`): `ProducibleMessage`

Sets the priority level for the message.

Only effective when producing to a priority queue. Higher priority messages
are processed before lower priority ones.

#### Parameters

##### priority

[`EMessagePriority`](../enumerations/EMessagePriority.md)

The priority level from EMessagePriority enum

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Example

```typescript
const message = new ProducibleMessage()
  .setPriority(EMessagePriority.HIGH)
  .setBody({ urgent: true });
```

#### See

 - [getPriority](#getpriority)
 - [hasPriority](#haspriority)
 - [disablePriority](#disablepriority)

***

### setQueue()

> **setQueue**(`queue`): `ProducibleMessage`

Sets the target queue for direct message delivery.

Setting a queue clears any previously set exchange configuration.

#### Parameters

##### queue

Queue name or parameters

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When queue parameters are invalid

#### Example

```typescript
const message = new ProducibleMessage()
  .setQueue('user-tasks')
  .setBody({ userId: 123, task: 'process' });
```

#### See

[getQueue](#getqueue)

***

### setRetryDelay()

> **setRetryDelay**(`delay`): `ProducibleMessage`

Sets the delay between retry attempts for failed messages.

Helps prevent overwhelming the system with immediate retries and allows
temporary issues to resolve.

#### Parameters

##### delay

`number`

Delay in milliseconds (0 means no delay)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When the delay is not a valid non-negative number

#### Example

```typescript
const message = new ProducibleMessage()
  .setRetryDelay(30000) // Wait 30 seconds between retries
  .setRetryThreshold(3); // Retry up to 3 times
```

#### See

 - [setRetryThreshold](#setretrythreshold)
 - [getRetryDelay](#getretrydelay)

***

### setRetryThreshold()

> **setRetryThreshold**(`threshold`): `ProducibleMessage`

Sets the maximum number of retry attempts for failed messages.

After exceeding this threshold, messages may be moved to a dead-letter queue.

#### Parameters

##### threshold

`number`

Maximum retry attempts (0 means no retries)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When the threshold is not a valid non-negative number

#### Example

```typescript
const message = new ProducibleMessage()
  .setRetryThreshold(5) // Retry up to 5 times
  .setRetryDelay(10000); // Wait 10 seconds between retries
```

#### See

 - [setRetryDelay](#setretrydelay)
 - [getRetryThreshold](#getretrythreshold)

***

### setScheduledCRON()

> **setScheduledCRON**(`cron`): `ProducibleMessage`

Sets a CRON expression for scheduled message delivery.

Can be combined with [setScheduledRepeat](#setscheduledrepeat) and [setScheduledRepeatPeriod](#setscheduledrepeatperiod) for complex scheduling.

#### Parameters

##### cron

`string`

Valid CRON expression (e.g., '0 0 10 * * *' for daily at 10 AM)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When the CRON expression is invalid

#### Example

```typescript
// Daily at 10 AM, then repeat 3 times with 10-minute intervals
const message = new ProducibleMessage()
  .setScheduledCRON('0 0 10 * * *')
  .setScheduledRepeat(3)
  .setScheduledRepeatPeriod(600000); // 10 minutes
```

#### See

 - [setScheduledRepeat](#setscheduledrepeat)
 - [setScheduledRepeatPeriod](#setscheduledrepeatperiod)

***

### setScheduledDelay()

> **setScheduledDelay**(`delay`): `ProducibleMessage`

Sets a delay before the message's initial delivery.

#### Parameters

##### delay

`number`

The delay in milliseconds (must be non-negative)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When the delay is not a valid non-negative number

#### Example

```typescript
const message = new ProducibleMessage()
  .setScheduledDelay(30000) // Deliver after 30 seconds
  .setBody({ task: 'delayed-task' });
```

#### See

[getScheduledDelay](#getscheduleddelay)

***

### setScheduledRepeat()

> **setScheduledRepeat**(`repeat`): `ProducibleMessage`

Sets the number of times a message should repeat after initial delivery.

#### Parameters

##### repeat

`number`

Number of repetitions (must be non-negative)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When the repeat value is not a valid non-negative number

#### Example

```typescript
const message = new ProducibleMessage()
  .setScheduledRepeat(3) // Repeat 3 times after initial delivery
  .setScheduledRepeatPeriod(60000); // Every minute
```

#### See

[setScheduledRepeatPeriod](#setscheduledrepeatperiod)

***

### setScheduledRepeatPeriod()

> **setScheduledRepeatPeriod**(`period`): `ProducibleMessage`

Sets the repeat period for scheduled message delivery.

Used with [setScheduledRepeat](#setscheduledrepeat) to create recurring messages with a fixed interval.

#### Parameters

##### period

`number`

The repeat period in milliseconds (must be non-negative)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When the period is not a valid non-negative number

#### Example

```typescript
const message = new ProducibleMessage()
  .setScheduledRepeatPeriod(60000) // Repeat every minute
  .setScheduledRepeat(5); // Repeat 5 times
```

#### See

[setScheduledRepeat](#setscheduledrepeat)

***

### setTopicExchange()

> **setTopicExchange**(`exchange`): `ProducibleMessage`

Sets a topic exchange for message routing.

Topic exchanges route messages based on routing key patterns.

#### Parameters

##### exchange

Exchange name or parameters

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When exchange parameters are invalid

#### Example

```typescript
const message = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.created')
  .setBody({ userId: 123 });
```

#### See

 - [setExchangeRoutingKey](#setexchangeroutingkey)
 - [setFanoutExchange](#setfanoutexchange)
 - [setDirectExchange](#setdirectexchange)

***

### setTTL()

> **setTTL**(`ttl`): `ProducibleMessage`

Sets the Time-To-Live (TTL) for the message.

Messages with expired TTL will be automatically removed from the queue.

#### Parameters

##### ttl

`number`

TTL in milliseconds (0 means no expiration)

#### Returns

`ProducibleMessage`

This instance for method chaining

#### Throws

When the TTL is not a valid non-negative number

#### Example

```typescript
const message = new ProducibleMessage()
  .setTTL(300000) // Expire after 5 minutes
  .setBody({ urgent: true });
```

#### See

[getTTL](#getttl)

***

### setDefaultConsumeOptions()

> `static` **setDefaultConsumeOptions**(`consumeOptions`): `void`

Sets default consume options for all future ProducibleMessage instances.

#### Parameters

##### consumeOptions

`Partial`\<[`TMessageConsumeOptions`](../type-aliases/TMessageConsumeOptions.md)\>

Partial consume options to override defaults

#### Returns

`void`

#### Static

#### Throws

When any provided value is invalid

#### Example

```typescript
// Set new defaults
ProducibleMessage.setDefaultConsumeOptions({
  ttl: 60000,
  retryThreshold: 5,
  retryDelay: 30000,
  consumeTimeout: 120000
});

// New instances will use these defaults
const message = new ProducibleMessage();
console.log(message.getTTL()); // 60000
console.log(message.getRetryThreshold()); // 5
```
