[RedisSMQ](../README.md) / [Documentation](README.md) / Message Lifecycle

# Message Lifecycle

This document provides a detailed walkthrough of a message's journey through RedisSMQ, highlighting the reliability
mechanisms at each stage.

## Complete Message Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCER SIDE                                     │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ Message created
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Message Production                                                       │
│    • ProducibleMessage created with payload and settings                    │
│    • Message validated (destination, routing keys, etc.)                    │
│    • Message ID generated (UUID)                                            │
│    • Timestamp added                                                        │
│                                                                             │
│    [Message structure validated before any Redis operation]                 │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ producer.produce()
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Message Persistence                                                      │
│    • Message stored in Redis (HSET with all metadata)                       │
│    • If scheduled → stored in scheduled sorted set (by timestamp)           │
│    • If immediate → added to queue                                          │
│    • Producer callback invoked only AFTER Redis confirms persistence        │
│                                                                             │
│    [Message exists in Redis before caller is notified]                      │
│    [Atomic: Single Redis operation ensures either complete or nothing]      │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         ┌─────────────────┐                                 │
│                    ┌───▶│  SCHEDULED      │                                 │
│                    │    │  (future)       │                                 │
│                    │    └─────────────────┘                                 │
│                    │           │                                            │
│                    │           │ Scheduler delivers at due time             │
│                    │           ▼                                            │
│                    │    ┌─────────────────┐                                 │
│                    └────│                 │                                 │
│                         │    PENDING      │                                 │
│                    ┌────│   (ready)       │                                 │
│                    │    └─────────────────┘                                 │
│                    │           │                                            │
│                    │           │                                            │
│                    │           ▼                                            │
│                    │    ┌─────────────────┐                                 │
│                    │    │  PROCESSING     │                                 │
│                    │    │                 │                                 │
│                    │    └─────────────────┘                                 │
│                    │           │                                            │
│                    │           │                                            │
│                    ▼           ▼                                            │
│                                                                             │
│    QUEUE STATES: Messages move through different queue types                │
│    • PENDING: Waiting for consumer                                          │
│    • PROCESSING: Currently being handled by consumer                        │
│    • SCHEDULED: Future delivery (separate queue)                            │
│                                                                             │
│    [Messages are never lost during state transitions]                       │
│    [Atomic: Lua scripts ensure state changes are atomic]                    │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ Consumer picks up message
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONSUMER SIDE                                     │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Message Acquisition                                                      │
│    • Consumer requests message from queue                                   │
│    • Message moved from PENDING → PROCESSING (atomic)                       │
│    • Consumer heartbeat tracking starts                                     │
│    • Visibility timer begins                                                │
│    • Message delivered to handler                                           │
│                                                                             │
│    [Message locked to this consumer with visibility timeout]                │
│    [Recovery: If consumer dies, message returns to PENDING after timeout]   │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ Handler processes message
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Message Processing                                                       │
│    • User code executes (sync or async)                                     │
│    • Heartbeats continue (consumer still alive)                             │
│    • Visibility timeout monitoring active                                   │
│                                                                             │
│    Two possible paths:                                                      │
│    ┌─────────────────────────────────────────┐  ┌─────────────────────────┐ │
│    │  PATH A: SUCCESS                        │  │  PATH B: FAILURE        │ │
│    │  Handler completes without error        │  │  Handler throws/calls   │ │
│    │  Calls done()                           │  │  done(error)            │ │
│    └─────────────────────────────────────────┘  └─────────────────────────┘ │
│                        │                                  │                 │
│                        ▼                                  ▼                 │
│              ┌─────────────────────┐              ┌──────────────────────┐  │
│              │ 5A. Acknowledge     │              │ 5B. Handle Failure   │  │
│              │ • Message removed   │              │ • Check retry policy │  │
│              │   from PROCESSING   │              │ • Increment retry    │  │
│              │ • Added to          │              │   count              │  │
│              │   ACKNOWLEDGED (if  │              │ • Determine action   │  │
│              │   audit enabled)    │              └──────────────────────┘  │
│              │ • Batch acks may    │                         │              │
│              │   delay removal     │                         ▼              │
│              └─────────────────────┘              ┌─────────────────────┐   │
│                                                   │ Retry Decision      │   │
│                                                   │                     │   │
│                                     ┌─────────────┼─────────────┐       │   │
│                                     │             │             │       │   │
│                                     ▼             ▼             ▼       │   │
│                             ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│                             │ REQUEUE     │ │ DELAY       │ │ DEAD LETTER │ │
│                             │ • Immediate │ │ • Wait      │ │ • Max       │ │
│                             │   retry     │ │   retryDelay│ │   retries   │ │
│                             │ • Message   │ │ • Scheduled │ │   exceeded  │ │
│                             │   back to   │ │   for future│ │ • TTL       │ │
│                             │   PENDING   │ │   delivery  │ │   expired   │ │
│                             └─────────────┘ └─────────────┘ └─────────────┘ │
│                                     │              │              │         │
│                                     └──────────────┼──────────────┘         │
│                                                    │                        │
│                                                    ▼                        │
│                                      ┌─────────────────────┐                │
│                                      │ Message returns to  │                │
│                                      │ appropriate queue   │                │
│                                      │ • PENDING (requeue) │                │
│                                      │ • SCHEDULED (delay) │                │
│                                      │ • DLQ (dead letter) │                │
│                                      └─────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. Final States                                                             │
│                                                                             │
│    ┌─────────────────┐                                                      │
│    │ ACKNOWLEDGED    │  ✓ Message processed successfully                    │
│    │                 │  ✓ Removed from active queues                        │
│    │                 │  ✓ Optional: stored in audit if enabled              │
│    └─────────────────┘                                                      │
│                                                                             │
│    ┌─────────────────┐                                                      │
│    │ DEAD LETTERED   │  ✗ Message failed permanently                        │
│    │                 │  ✗ Retries exhausted                                 │
│    │                 │  ✗ TTL expired                                       │
│    │                 │  ✗ Optional: stored for debugging                    │
│    └─────────────────┘                                                      │
│                                                                             │
│    ┌─────────────────┐                                                      │
│    │ EXPIRED         │  ⏰ TTL reached before processing                    │
│    │                 │  ⏰ Message discarded (may go to DLQ if configured)  │
│    └─────────────────┘                                                      │
│                                                                             │
│    [All messages reach a final state, none disappear]                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

The RedisSMQ message lifecycle ensures reliability through:

- **Atomic operations** at every state transition
- **Timeout-based recovery** for crashed consumers
- **Configurable retry policies** for failed messages
- **Dead letter queues** for permanent failures
- **Audit trails** for complete visibility
- **At least once delivery** with idempotency guidance

By understanding and properly configuring each stage, you can build systems that reliably process millions of messages without loss.

---

**Related Documentation**:

- [Message Reliability](message-reliability.md) - How RedisSMQ guarantees at-least-once delivery
- [Consuming Messages](consuming-messages.md) - How to receive and process messages
- [Producing Messages](producing-messages.md) - How to send messages
- [Message Batch Acknowledgments](message-batch-acknowledgements.md) - Performance optimization
- [Message Batch Unacknowledgments](message-batch-unacknowledgements.md) - Handling failures
- [Message Audit](message-audit.md) - Tracking processed messages
- [Graceful Shutdown](graceful-shutdown.md) - Proper cleanup
- [EventBus](event-bus.md) - Monitoring events
- [Configuration](configuration.md) - Complete setup options
