[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / THeartbeatEvent

# Type Alias: THeartbeatEvent\<T\>

> **THeartbeatEvent**\<`T`\> = `object`

## Type Parameters

### T

`T`

## Properties

### heartbeat.beat()

> **heartbeat.beat**: (`componentId`, `componentType`, `timestamp`, `payload`) => `void`

#### Parameters

##### componentId

`string`

##### componentType

`string`

##### timestamp

`number`

##### payload

[`IHeartbeatPayload`](../interfaces/IHeartbeatPayload.md)\<`T`\>

#### Returns

`void`

---

### heartbeat.down()

> **heartbeat.down**: (`componentId`, `componentType`) => `void`

#### Parameters

##### componentId

`string`

##### componentType

`string`

#### Returns

`void`

---

### heartbeat.error()

> **heartbeat.error**: (`err`, `componentId`, `componentType`) => `void`

#### Parameters

##### err

`Error`

##### componentId

`string`

##### componentType

`string`

#### Returns

`void`

---

### heartbeat.goingDown()

> **heartbeat.goingDown**: (`componentId`, `componentType`) => `void`

#### Parameters

##### componentId

`string`

##### componentType

`string`

#### Returns

`void`

---

### heartbeat.goingUp()

> **heartbeat.goingUp**: (`componentId`, `componentType`) => `void`

#### Parameters

##### componentId

`string`

##### componentType

`string`

#### Returns

`void`

---

### heartbeat.up()

> **heartbeat.up**: (`componentId`, `componentType`) => `void`

#### Parameters

##### componentId

`string`

##### componentType

`string`

#### Returns

`void`
