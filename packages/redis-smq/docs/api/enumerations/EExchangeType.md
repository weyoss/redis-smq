[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EExchangeType

# Enumeration: EExchangeType

Exchange routing model.

Determines how a message published to an exchange is matched to the
queues bound to it:

- DIRECT: exact routing key match. A message with routing key `k`
  reaches every queue bound with the same key `k`.

- TOPIC: pattern-based routing. The message's routing key is matched
  against the binding pattern of each bound queue, using AMQP-style
  wildcards (`*` for one token, `#` for zero or more tokens).

- FANOUT: broadcast. Every queue bound to the exchange receives a
  copy, regardless of routing key.

The integer values are persisted in Redis (as the `TYPE` field of the
exchange's properties hash) and passed as arguments to the exchange
Lua scripts. Reordering or renumbering is a breaking change to
persisted data.

## Enumeration Members

### DIRECT

> **DIRECT**: `0`

---

### FANOUT

> **FANOUT**: `1`

---

### TOPIC

> **TOPIC**: `2`
