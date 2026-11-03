[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TLifecycleState

# Type Alias: TLifecycleState

> **TLifecycleState** = `"DOWN"` \| `"GOING_UP"` \| `"UP"` \| `"GOING_DOWN"`

The four states `Lifecycle` can occupy.

DOWN — committed off; no transition in progress
GOING_UP — transition to on pending (committable or rollback-able)
UP — committed on; no transition in progress
GOING_DOWN — transition to off pending (committable only)

The two `GOING_*` states exist so consumers can distinguish "shutdown
requested" from "shutdown complete" — the difference between
`goingDown()` (stop accepting new work) and `commit()` (fully stopped).

Note that `GOING_UP` is cancellable but `GOING_DOWN` is not: see
`rollback()`.
