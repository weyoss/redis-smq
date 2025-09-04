[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TConsumerHeartbeatEvent

# Type Alias: TConsumerHeartbeatEvent

> **TConsumerHeartbeatEvent** = `object`

## Properties

### consumerHeartbeat.error()

> **consumerHeartbeat.error**: (`err`) => `void`

#### Parameters

##### err

`Error`

#### Returns

`void`

***

### consumerHeartbeat.heartbeat()

> **consumerHeartbeat.heartbeat**: (`consumerId`, `timestamp`, `heartbeatPayload`) => `void`

#### Parameters

##### consumerId

`string`

##### timestamp

`number`

##### heartbeatPayload

[`IConsumerHeartbeat`](../interfaces/IConsumerHeartbeat.md)

#### Returns

`void`
