[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IConsumerParsedOptions

# Interface: IConsumerParsedOptions

The fully-resolved option set a consumer runs with.

Every field is required, and the two batch unions are narrowed to their
object form with every field populated. This is what
`Consumer.getDefaultOptions()` returns and what the consumer stores
internally after merging user options with defaults.

A caller programming against `IConsumerOptions` can accept the parsed
form anywhere it accepts the raw form; the parsed form is a strict
subtype of the union-free version.

## Extends

- `Required`\<`Omit`\<[`IConsumerOptions`](IConsumerOptions.md), `"batchAcks"` \| `"batchUnacks"`\>\>

## Properties

### batchAcks

> **batchAcks**: `Required`\<[`IConsumerBatchConfig`](IConsumerBatchConfig.md)\>

---

### batchUnacks

> **batchUnacks**: `Required`\<[`IConsumerBatchConfig`](IConsumerBatchConfig.md)\>

---

### enableMultiplexing

> **enableMultiplexing**: `boolean`

Enables multiplexed consumption across all queues.

When true, a single consumer instance schedules all of its message
handlers through a shared round-robin tick loop instead of running a
dedicated dequeue loop per handler. This reduces the number of Redis
connections the consumer holds and is useful when a single process
handles many queues.

When false (the default), each handler runs its own dequeue loop on
its own connection. This gives lower latency per message.

#### Inherited from

[`IConsumerOptions`](IConsumerOptions.md).[`enableMultiplexing`](IConsumerOptions.md#enablemultiplexing)

---

### heartbeatTTL

> **heartbeatTTL**: `number`

Time-to-live in milliseconds for this consumer's heartbeat key in
Redis.

A consumer is considered offline if its heartbeat key has expired.
Other consumers in the same queue use this to detect offline peers
and recover any messages left in their processing queues. Longer
TTLs tolerate transient disconnects; shorter TTLs recover faster.

Choose a value comfortably larger than the longest tolerable pause
between heartbeats. The default (60000) tolerates the process being
suspended for a few seconds without triggering peer recovery.

#### Inherited from

[`IConsumerOptions`](IConsumerOptions.md).[`heartbeatTTL`](IConsumerOptions.md#heartbeatttl)
