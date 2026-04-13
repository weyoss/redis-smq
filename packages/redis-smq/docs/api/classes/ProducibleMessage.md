[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ProducibleMessage

# Class: ProducibleMessage

Configures a message for production to queues or exchanges.

Provides methods to set message properties: TTL, retry policies,
scheduling, priority, and routing (direct queue or exchange-based).

## Example

```ts
const message = new ProducibleMessage()
  .setBody({ userId: 123 })
  .setQueue('orders')
  .setTTL(60000)
  .setPriority(EMessagePriority.HIGH);
```

## Constructors

### Constructor

> **new ProducibleMessage**(): `ProducibleMessage`

#### Returns

`ProducibleMessage`

## Methods

### disablePriority()

> **disablePriority**(): `ProducibleMessage`

Removes the priority setting from the message.

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.disablePriority();
```

---

### getBody()

> **getBody**(): `unknown`

Gets the message payload.

#### Returns

`unknown`

#### Example

```ts
const body = msg.getBody();
```

---

### getConsumeTimeout()

> **getConsumeTimeout**(): `number`

Gets the consumption timeout.

#### Returns

`number`

#### Example

```ts
const timeout = msg.getConsumeTimeout();
```

---

### getCreatedAt()

> **getCreatedAt**(): `number`

Gets the timestamp when the message was created.

#### Returns

`number`

#### Example

```ts
const msg = new ProducibleMessage();
console.log(msg.getCreatedAt());
```

---

### getExchange()

> **getExchange**(): [`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md) \| `null`

Gets the current exchange configuration.

#### Returns

[`IExchangeParsedParams`](../interfaces/IExchangeParsedParams.md) \| `null`

#### Example

```ts
const exchange = msg.getExchange();
console.log(exchange?.type);
```

---

### getExchangeRoutingKey()

> **getExchangeRoutingKey**(): `string` \| `null`

Gets the current exchange routing key.

#### Returns

`string` \| `null`

#### Example

```ts
const key = msg.getExchangeRoutingKey();
```

---

### getPriority()

> **getPriority**(): [`EMessagePriority`](../enumerations/EMessagePriority.md) \| `null`

Gets the priority level of the message.

#### Returns

[`EMessagePriority`](../enumerations/EMessagePriority.md) \| `null`

#### Example

```ts
const priority = msg.getPriority();
```

---

### getQueue()

> **getQueue**(): [`IQueueParams`](../interfaces/IQueueParams.md) \| `null`

Gets the current target queue configuration.

#### Returns

[`IQueueParams`](../interfaces/IQueueParams.md) \| `null`

#### Example

```ts
const queue = msg.getQueue();
console.log(queue?.name);
```

---

### getRetryDelay()

> **getRetryDelay**(): `number`

Gets the retry delay.

#### Returns

`number`

#### Example

```ts
const delay = msg.getRetryDelay();
```

---

### getRetryThreshold()

> **getRetryThreshold**(): `number`

Gets the retry threshold.

#### Returns

`number`

#### Example

```ts
const threshold = msg.getRetryThreshold();
```

---

### getScheduledCRON()

> **getScheduledCRON**(): `string` \| `null`

Gets the CRON expression for scheduled delivery.

#### Returns

`string` \| `null`

#### Example

```ts
const cron = msg.getScheduledCRON();
```

---

### getScheduledDelay()

> **getScheduledDelay**(): `number` \| `null`

Gets the scheduled delay for message delivery.

#### Returns

`number` \| `null`

#### Example

```ts
const delay = msg.getScheduledDelay();
```

---

### getScheduledRepeat()

> **getScheduledRepeat**(): `number`

Gets the number of times the message is scheduled to repeat.

#### Returns

`number`

#### Example

```ts
const repeat = msg.getScheduledRepeat();
```

---

### getScheduledRepeatPeriod()

> **getScheduledRepeatPeriod**(): `number` \| `null`

Gets the scheduled repeat period.

#### Returns

`number` \| `null`

#### Example

```ts
const period = msg.getScheduledRepeatPeriod();
```

---

### getTTL()

> **getTTL**(): `number`

Gets the Time-To-Live (TTL) value.

#### Returns

`number`

#### Example

```ts
const ttl = msg.getTTL();
```

---

### hasPriority()

> **hasPriority**(): `boolean`

Checks if a priority level has been set.

#### Returns

`boolean`

#### Example

```ts
if (msg.hasPriority()) {
  console.log(msg.getPriority());
}
```

---

### resetScheduledParams()

> **resetScheduledParams**(): `ProducibleMessage`

Resets all scheduled parameters to defaults.

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.resetScheduledParams();
```

---

### setBody()

> **setBody**(`body`): `ProducibleMessage`

Sets the message payload.

#### Parameters

##### body

`unknown`

Any JSON-serializable value

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setBody({ userId: 123, action: 'process' });
```

---

### setConsumeTimeout()

> **setConsumeTimeout**(`timeout`): `ProducibleMessage`

Sets the consumption timeout for the message.

#### Parameters

##### timeout

`number`

Timeout in milliseconds (0 = no timeout)

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setConsumeTimeout(30000); // 30 second timeout
```

---

### setDirectExchange()

> **setDirectExchange**(`exchange`): `ProducibleMessage`

Sets a direct exchange for message routing.

#### Parameters

##### exchange

Exchange name or parameters

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setDirectExchange('tasks').setExchangeRoutingKey('high');
```

---

### setExchangeRoutingKey()

> **setExchangeRoutingKey**(`routingKey`): `ProducibleMessage`

Sets the routing key for exchange-based message delivery.

#### Parameters

##### routingKey

`string`

Routing key

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setTopicExchange('events').setExchangeRoutingKey('user.login');
```

---

### setFanoutExchange()

> **setFanoutExchange**(`exchange`): `ProducibleMessage`

Sets a fanout exchange for message routing.

#### Parameters

##### exchange

Exchange name or parameters

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setFanoutExchange('notifications');
```

---

### setPriority()

> **setPriority**(`priority`): `ProducibleMessage`

Sets the priority level for the message.

#### Parameters

##### priority

[`EMessagePriority`](../enumerations/EMessagePriority.md)

Priority from EMessagePriority enum

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setPriority(EMessagePriority.HIGH);
```

---

### setQueue()

> **setQueue**(`queue`): `ProducibleMessage`

Sets the target queue for direct message delivery.

#### Parameters

##### queue

Queue name or parameters

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setQueue('orders');
```

---

### setRetryDelay()

> **setRetryDelay**(`delay`): `ProducibleMessage`

Sets the delay between retry attempts.

#### Parameters

##### delay

`number`

Delay in milliseconds

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setRetryDelay(30000); // Wait 30 seconds between retries
```

---

### setRetryThreshold()

> **setRetryThreshold**(`threshold`): `ProducibleMessage`

Sets the maximum number of retry attempts for failed messages.

#### Parameters

##### threshold

`number`

Maximum retry attempts (0 = no retries)

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setRetryThreshold(5);
```

---

### setScheduledCRON()

> **setScheduledCRON**(`cron`): `ProducibleMessage`

Sets a CRON expression for scheduled message delivery.

#### Parameters

##### cron

`string`

Valid CRON expression (e.g., '0 0 10 \* \* \*')

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setScheduledCRON('0 0 10 * * *'); // Daily at 10 AM
```

---

### setScheduledDelay()

> **setScheduledDelay**(`delay`): `ProducibleMessage`

Sets a delay before the message's initial delivery.

#### Parameters

##### delay

`number`

Delay in milliseconds

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setScheduledDelay(30000); // Deliver after 30 seconds
```

---

### setScheduledRepeat()

> **setScheduledRepeat**(`repeat`): `ProducibleMessage`

Sets the number of times a message should repeat after initial delivery.

#### Parameters

##### repeat

`number`

Number of repetitions

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setScheduledRepeat(3); // Repeat 3 times
```

---

### setScheduledRepeatPeriod()

> **setScheduledRepeatPeriod**(`period`): `ProducibleMessage`

Sets the repeat period for scheduled message delivery.

#### Parameters

##### period

`number`

Repeat period in milliseconds

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setScheduledRepeatPeriod(60000); // Every minute
```

---

### setTopicExchange()

> **setTopicExchange**(`exchange`): `ProducibleMessage`

Sets a topic exchange for message routing.

#### Parameters

##### exchange

Exchange name or parameters

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setTopicExchange('events').setExchangeRoutingKey('user.created');
```

---

### setTTL()

> **setTTL**(`ttl`): `ProducibleMessage`

Sets the Time-To-Live (TTL) for the message.

#### Parameters

##### ttl

`number`

TTL in milliseconds (0 = no expiration)

#### Returns

`ProducibleMessage`

#### Example

```ts
msg.setTTL(300000); // Expire after 5 minutes
```

---

### setDefaultConsumeOptions()

> `static` **setDefaultConsumeOptions**(`consumeOptions`): `void`

Sets default consume options for all future instances.

#### Parameters

##### consumeOptions

`Partial`\<[`TMessageConsumeOptions`](../type-aliases/TMessageConsumeOptions.md)\>

Partial options to override defaults

#### Returns

`void`

#### Example

```ts
ProducibleMessage.setDefaultConsumeOptions({
  ttl: 60000,
  retryThreshold: 5,
  retryDelay: 30000,
});
```
