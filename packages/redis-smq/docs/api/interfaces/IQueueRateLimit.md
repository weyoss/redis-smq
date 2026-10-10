[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IQueueRateLimit

# Interface: IQueueRateLimit

Rate limit configuration for a queue.

Applies to the consumption path: no more than `limit` messages are
dequeued per `interval` milliseconds. Enforced by an atomic Redis
check that also decrements a counter, so the limit holds across
multiple consumers.

The library does not rate-limit publishing; publishing into a
rate-limited queue is unbounded and simply buffers.

## Properties

### interval

> **interval**: `number`

Time window for the limit, in milliseconds. Minimum 1000.

---

### limit

> **limit**: `number`

Maximum number of messages that may be processed within `interval`.
