[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EQueueDeliveryModel

# Enumeration: EQueueDeliveryModel

Delivery model for a queue.

- POINT_TO_POINT: each message is delivered to exactly one consumer.
- PUB_SUB: each message is delivered to every consumer group
  subscribed to the queue. Consumers must provide a
  group ID (or the library generates an ephemeral
  one).

The integer values are persisted in Redis (the `DELIVERY_MODEL` hash
field).

## Enumeration Members

### POINT\_TO\_POINT

> **POINT\_TO\_POINT**: `0`

---

### PUB\_SUB

> **PUB\_SUB**: `1`
