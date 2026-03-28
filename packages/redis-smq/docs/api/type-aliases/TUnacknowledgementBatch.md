[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TUnacknowledgementBatch

# Type Alias: TUnacknowledgementBatch

> **TUnacknowledgementBatch** = `object`

## Properties

### callbacks

> **callbacks**: `ICallback`\<[`TUnacknowledgementResult`](TUnacknowledgementResult.md)\>[]

---

### messages

> **messages**: `object`[]

#### message

> **message**: `MessageEnvelope`

#### resolution

> **resolution**: [`TUnacknowledgementResolution`](TUnacknowledgementResolution.md)

---

### timer

> **timer**: `NodeJS.Timeout` \| `null`
