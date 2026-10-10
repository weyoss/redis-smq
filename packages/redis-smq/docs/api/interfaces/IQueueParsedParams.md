[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IQueueParsedParams

# Interface: IQueueParsedParams

A queue plus an optional consumer group.

The `groupId` is `null` for POINT_TO_POINT queues and for PUB_SUB
queues where the caller has not yet specified a group. During handler
registration the consumer replaces a `null` groupId with the effective
group — an explicit one, or an ephemeral `cid-<consumerId>`.

## Properties

### groupId

> **groupId**: `string` \| `null`

---

### queueParams

> **queueParams**: [`IQueueParams`](IQueueParams.md)
