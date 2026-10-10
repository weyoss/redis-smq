[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EQueueStateTransitionReason

# Type Alias: EQueueStateTransitionReason

> **EQueueStateTransitionReason** = [`ESystemStateTransitionReason`](../enumerations/ESystemStateTransitionReason.md) \| [`EStateTransitionReason`](../enumerations/EStateTransitionReason.md)

Any reason a transition may carry, whether produced by the system or
supplied by a caller.

This is the type of `IQueueStateTransition.reason`. Callers who
receive a transition and inspect its reason see this union; they
cannot tell from the type alone whether the reason came from the
system or from a caller, but the enum values are disjoint, so a
switch on specific members works as expected.
