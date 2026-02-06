[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TConsumerHeartbeatEvent

# Type Alias: TConsumerHeartbeatEvent

> **TConsumerHeartbeatEvent** = `object`

## Properties

### consumerHeartbeat.error()

> **consumerHeartbeat.error**: (`err`, `consumerId`) => `void`

#### Parameters

##### err

`Error`

##### consumerId

`string`

#### Returns

`void`

---

### consumerHeartbeat.heartbeat()

> **consumerHeartbeat.heartbeat**: (`consumerId`, `timestamp`, `heartbeatPayload`) => `void`

#### Parameters

##### consumerId

`string`

##### timestamp

`number`

##### heartbeatPayload

`IConsumerHeartbeat`

#### Returns

`void`
