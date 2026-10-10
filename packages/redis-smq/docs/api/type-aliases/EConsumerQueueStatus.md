[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EConsumerQueueStatus

# Type Alias: EConsumerQueueStatus

> **EConsumerQueueStatus** = `"active"` \| `"stopped"`

Whether a consumer is currently processing messages from a queue.

- `active`: a handler instance is running and its dequeue loop is
  consuming messages from the queue.

- `stopped`: the handler is configured but not running. This happens
  when the queue's operational state is not ACTIVE (PAUSED, STOPPED, or
  LOCKED), or when the handler is between start and stop during a state
  transition.
