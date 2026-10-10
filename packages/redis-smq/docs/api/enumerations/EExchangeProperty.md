[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EExchangeProperty

# Enumeration: EExchangeProperty

Field names for the exchange's properties hash in Redis.

The integer values are hash field keys — the exchange's properties
hash stores values keyed by these numbers, and the exchange scripts
pass them as ARGV constants. Reordering or renumbering is a breaking
change to persisted data.

This enum is exported by the current public surface. It is arguably an
internal detail (the Redis hash layout) rather than a user-facing
concept; a future major release could move it to an internal
directory.

## Enumeration Members

### QUEUE\_POLICY

> **QUEUE\_POLICY**: `1`

---

### TYPE

> **TYPE**: `0`
