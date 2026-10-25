# RedisSMQ Web UI

A browser-based dashboard for [RedisSMQ](https://github.com/weyoss/redis-smq).

Create and configure queues, publish and browse messages, manage
exchanges and namespaces, pause and resume queues, and edit the runtime
configuration. No CLI needed.

---

## Getting started

The UI is served by [**RedisSMQ Web Server**](../redis-smq-web-server/README.md),
which also hosts the REST API.

```bash
npm install redis-smq redis-smq-common redis-smq-rest-api \
            redis-smq-web-ui redis-smq-web-server ioredis

npx redis-smq-web-server
```

UI at `http://localhost:8080/`, API at `http://localhost:8080/api`.

Common flags: `--base-path`, `--api-proxy-target`, `--port`,
`--redis-*`, `--log-*`. Full reference in the
[Web Server README](../redis-smq-web-server/README.md).

---

## Concepts

Four tables and one paragraph. That's the whole mental model.

### Queue types

| Type         | Behavior                                       |
| ------------ | ---------------------------------------------- |
| **FIFO**     | First in, first out (the default)              |
| **LIFO**     | Last in, first out                             |
| **Priority** | Higher-priority messages delivered first (0–7) |

### Delivery models

| Model              | Behavior                                                          |
| ------------------ | ----------------------------------------------------------------- |
| **Point-to-point** | Each message goes to exactly one consumer.                        |
| **Pub/sub**        | Each message is broadcast to every consumer group; a group picks. |

### Message states — the tabs on the Messages screen

| Tab               | Shows                                        |
| ----------------- | -------------------------------------------- |
| **Published**     | **Every** message — all states combined.     |
| **Scheduled**     | Waiting for its scheduled time or cron fire. |
| **Pending**       | Waiting for a consumer.                      |
| **Dead-lettered** | Failed processing.                           |
| **Acknowledged**  | Processed successfully.                      |

### Operational states — the banner on a queue page

| State       | What it means                                          |
| ----------- | ------------------------------------------------------ |
| **Active**  | Normal operation.                                      |
| **Paused**  | Messages arrive but aren't delivered. For maintenance. |
| **Stopped** | Production and consumption both blocked.               |
| **Locked**  | A server operation is running; wait for it to release. |

**Namespaces** group related queues and exchanges (like folders).
`default` is used if you don't pick one. They appear automatically when
needed and disappear when empty.

---

## Screens

| Screen              | What's there                                                                    |
| ------------------- | ------------------------------------------------------------------------------- |
| **Home**            | Counts, recent queues, quick actions.                                           |
| **Queues**          | Every queue. Create, open, delete.                                              |
| **Queue detail**    | Statistics, config, exchanges, rate limit, consumer groups, consumers, history. |
| **Messages**        | Five state tabs. Publish, purge, bulk-delete.                                   |
| **Message detail**  | Six tabs — overview, body, state, scheduling, timeline, unack history.          |
| **Exchanges**       | Cards for each exchange; bind queues, view details.                             |
| **Exchange detail** | Bindings grouped by routing key; match preview for a given key.                 |
| **Namespaces**      | One card per namespace with counts and filtered-list links.                     |
| **Configuration**   | Default namespace, logger settings, message-audit toggles.                      |

Exchange types when binding: **Direct** (exact key), **Fanout** (every
queue), **Topic** (`*` one word, `#` many).

---

## Two things to know

**Requeue duplicates.** The original message stays where it was; a
**new** message is produced with the same body and published to the same
queue. You now have two. The copy's **Scheduling** tab links back via
`Requeued parent`. Works on **acknowledged** and **dead-lettered**
messages.

**Purge "Published" means everything.** Not just pending — every message
regardless of state. For "all messages" you must tick an acknowledgement
checkbox before the button enables. **Cancel purge** stops it, but
**closing the dialog does not** — it runs server-side.

---

## Troubleshooting

| Symptom                                  | What to do                                                   |
| ---------------------------------------- | ------------------------------------------------------------ |
| Footer says **API unreachable**          | Server isn't reachable. Click the indicator to re-check.     |
| A queue says **Locked**                  | A server operation is running. Wait.                         |
| **NamespaceNotFoundError** on a bookmark | Its last queue and exchange were deleted. Use the top nav.   |
| Pending message, no consumer             | **Active consumers** is zero. Start your consumer.           |
| Purge deleted more than expected         | "Published" = all messages. Pick a narrower scope next time. |

Confirmation dialogs may fail with these errors — all appear inline in
the modal:

| Error                          | Cause                                     |
| ------------------------------ | ----------------------------------------- |
| `QueueNotEmptyError`           | Queue still has messages. Purge first.    |
| `QueueHasActiveConsumersError` | A consumer is still connected.            |
| `QueueHasBoundExchangesError`  | Queue is bound to an exchange. Unbind it. |
| `ExchangeHasBoundQueuesError`  | Exchange has queues bound. Unbind them.   |
| `ConsumerGroupNotEmptyError`   | Group has pending messages. Purge them.   |

**Unack history empty?** The feature is off by default — enable it in
**Configuration → Message audit**.

---

## Learn more

- [RedisSMQ documentation](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq/docs)
- [RedisSMQ REST API](../redis-smq-rest-api/README.md)
- [RedisSMQ Web Server](../redis-smq-web-server/README.md) — full CLI and deployment reference
- [Compatibility matrix](https://github.com/weyoss/redis-smq-docs#compatibility-matrix) — pick `@latest` or `@next` and keep packages aligned

## License

RedisSMQ Web UI is released under the [MIT License](../../LICENSE).
