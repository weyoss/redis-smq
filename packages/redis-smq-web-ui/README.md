<img src="screenshot.png" />

---

# RedisSMQ Web UI

A browser-based dashboard for [RedisSMQ](https://github.com/weyoss/redis-smq) —
the Redis-backed message queue.

Use it to inspect queues, publish and browse messages, manage exchanges,
and tune runtime configuration, all without touching a command line.

---

## What you can do

- **See the whole system at a glance** on the Home dashboard — how many
  queues, exchanges, and namespaces exist, and quick shortcuts into the
  most common actions.
- **Create and configure queues** — FIFO, LIFO, or priority; point-to-point
  or pub/sub; per-queue rate limiting; consumer groups.
- **Browse messages** by state (published, scheduled, pending,
  dead-lettered, acknowledged), open one to see its full state history,
  and delete, requeue, or bulk-delete them.
- **Publish messages** directly to a queue or through an exchange, with
  scheduling, TTL, priority, retry, and consume-timeout options.
- **Purge messages** from a queue by scope, with a running-job indicator
  and cancellation.
- **Manage exchanges** — direct, fanout, and topic — bind and unbind
  queues, and preview which queues a given routing key would reach.
- **Pause, stop, and resume queues** for maintenance, and review each
  queue's operational history.
- **Organize everything into namespaces** so related queues and exchanges
  are grouped together.
- **Watch the connection** to the API from the footer indicator, and view
  or edit the runtime configuration from the Configuration page.

---

## Installation

Typically consumed via the [RedisSMQ Web Server](../redis-smq-web-server/README.md). To set up everything:

```bash
npm install redis-smq redis-smq-common redis-smq-rest-api redis-smq-web-ui redis-smq-web-server

# Choose a Redis client:
npm install ioredis
# or
npm install @redis/client
```

## Version Compatibility

Always install matching versions of RedisSMQ packages to ensure compatibility. See [version compatibility](../redis-smq/docs/version-compatibility.md) for details.

## Quick start

Use the [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md) to serve the UI and either mount the REST API in-process or proxy to an external instance.

- In-process API (default):
  - UI at http://localhost:8080/
  - API at http://localhost:8080/api
- Proxy to an external REST API:
  - UI is served locally
  - API/docs/assets are forwarded to the upstream API

Examples:

```bash
# Default (UI at /, API at /api)
npx redis-smq-web-server

# Serve under a sub-path (e.g., behind a reverse proxy)
npx redis-smq-web-server --base-path /redis-smq

# Proxy API/docs/assets to an external REST API
npx redis-smq-web-server --api-proxy-target http://127.0.0.1:7210
```

See [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md) for CLI options such as:

- `--port`
- `--base-path`
- `--api-proxy-target`
- Redis connection and logging options (used only when hosting the API in-process)

## Configuration and routing

- Base path
  - When served by [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md), basePath controls where the UI and local API/docs are mounted.
  - Examples:
    - basePath = / → UI at /, API at /api, Swagger UI at /docs
    - basePath = /redis-smq → UI at /redis-smq, API at /redis-smq/api, Swagger UI at /redis-smq/docs

- API endpoint
  - With an embedded API (no proxy): the server mounts the REST API alongside the UI under <basePath>/api.
  - With a proxy target: the server forwards <basePath>/api, <basePath>/docs, and <basePath>/assets to the configured upstream URL.

- Standalone/static hosting (advanced)
  - If hosting the UI assets yourself:
    - Serve the SPA with history fallback (so client-side routes work on refresh).
    - Ensure the public base path matches where you host the app.
    - Proxy API requests to the REST API under the same public base path (e.g., <basePath>/api).
    - Expose <basePath>/docs and <basePath>/assets if you want Swagger UI and API schema accessible.
  - Note: [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md) already handles these concerns and is the simplest path.

## Deploying behind a reverse proxy

- Set a public sub-path using the web server’s --base-path (e.g., `/redis-smq`).
- Forward both the UI and API prefixes through your proxy:
  - `/redis-smq` → web server
- If proxying the API to an external service, combine with --api-proxy-target:
  - Client → reverse proxy → web server (`/redis-smq`)
  - Web server proxies `/redis-smq/api`, `/redis-smq/swagger` → external API

## The API-connected indicator

Look at the footer, bottom-right. You'll see one of:

| Indicator             | Meaning                                     |
| --------------------- | ------------------------------------------- |
| ● **API connected**   | Everything is working.                      |
| ● **API unreachable** | The API isn't responding. Check the server. |
| ● **Checking API**    | Startup ping in progress.                   |

Click the indicator to re-check on demand.

---

## A tour of the screens

### Home

The dashboard. From here you can:

- **Jump to any recent queue** using the Recent queues list.
- **Start a common workflow** with one click from Quick actions.
- **Confirm the current scale** via the Queues / Exchanges / Namespaces
  counters at the top.
- **Read a quick primer** (Getting started card) if the system is empty.

### Queues

The full list of queues, sortable by name. Each row has:

- **Open** — click the queue name to go to its detail page.
- **View** — same as clicking the name.
- **Delete** — with confirmation. Deleting a queue also deletes every
  message in it.

Use **Create queue** at the top right to add a new one. You'll be asked
for a name, namespace, type (FIFO/LIFO/Priority), and delivery model
(point-to-point or pub/sub).

### Queue detail

Everything about a single queue:

- **Message statistics** — pending, acknowledged, dead-lettered, scheduled
  counts at a glance.
- **Configuration** — name, namespace, type, delivery model, current
  operational state, total message count.
- **Bound exchanges** — every exchange that routes messages into this
  queue, with a jump link.
- **Rate limiting** — see, set, or clear the current rate limit.
- **Consumer groups** — only on pub/sub queues. Create and delete groups.
- **Active consumers** — who's currently connected, refreshed
  automatically every 15 seconds.
- **Operational state history** — every pause, stop, and resume with a
  timestamp, reason, and any operator notes.

Across the top are context-sensitive actions:

- **View messages**, **Refresh**, **Delete** — always available.
- **Pause** and **Stop** — when the queue is Active.
- **Resume** — when the queue is Paused or Stopped.

### Messages

Browse a queue's messages split across tabs by status:

| Tab               | Shows                                                    |
| ----------------- | -------------------------------------------------------- |
| **Published**     | Every message ever published to this queue — all states. |
| **Scheduled**     | Messages waiting for a scheduled time or cron.           |
| **Pending**       | Messages waiting for a consumer.                         |
| **Dead-lettered** | Messages that failed processing.                         |
| **Acknowledged**  | Messages already processed successfully.                 |

Each row shows the message ID, current status, priority (if any), and a
preview of the body. Click a row to open the message detail, or use the
row's icon buttons to delete or requeue a single message.

**Bulk operations** — tick one or more checkboxes to reveal a toolbar
with **Delete selected** and **Clear**. Deleting still requires a
confirmation.

**Publish** at the top right opens the publishing modal (see below).

**Purge** at the top right opens the purge modal — see _Purge messages_.

**On pub/sub queues**, when you visit the Pending tab and no consumer
group is selected, you'll first be asked to pick a group. Click **Change
group** in the banner to switch.

### Message detail

Click any row to open a modal with tabs:

- **Overview** — ID, status, priority, queue, TTL, retry settings.
- **Body** — the full message body, with a **Copy** button.
- **State** — every timestamp from the message's life (created,
  published, processed, acknowledged, dead-lettered, etc.).
- **Scheduling** — scheduled time, cron, repeat configuration.
- **Timeline** — a chronological event list.
- **Unack history** — why and when the message was unacknowledged
  (requires the feature to be enabled in the Configuration).

From the modal footer you can **Requeue** (dead-lettered messages only)
or **Delete** the message.

### Publish a message

Open from any Messages view, or the "Create queue" Quick action on Home.

1. **Pick the destination.** Direct to a queue (namespace + name) or
   through an exchange (namespace, name, type, and routing key for
   direct and topic exchanges).
2. **Write the body.** JSON or plain text. The JSON tab validates before
   you submit.
3. **Optionally set** priority, TTL, consume timeout, retry threshold,
   and retry delay.
4. **Optionally schedule.** Use _either_ a delay _or_ a cron pattern — the
   two are mutually exclusive. Repeat count and period control re-fires.

When the message is published you'll see the assigned message ID(s) and
can jump straight to the queue it landed in.

### Purge messages

Open from any Messages view.

1. **Choose the scope.** Published (= _all messages_), Pending, Scheduled,
   Dead-lettered, or Acknowledged.
2. **For "all messages"**, tick the acknowledgement checkbox — this is
   deliberately friction to protect against accidental total loss.
3. **Confirm.** The UI shows a live count while the server works, and you
   can **Cancel purge** at any time. The job continues even if you close
   the dialog.

On a pub/sub queue with a consumer group selected, the purge only affects
that group's pending messages and completes synchronously.

### Exchanges

Every exchange in the system, presented as cards. Each card shows:

- The exchange type (direct / fanout / topic) with a color-coded icon.
- How many queues are bound to it.
- Up to three of the bound queues, with the routing key or pattern.

**Bind queue** on a card opens the binding modal. **View details** opens
the exchange's own page.

Use **Create exchange** at the top right to add one. You'll pick a name,
namespace, type, and queue policy (standard or priority).

### Exchange detail

- **Bindings** — every queue bound to this exchange, grouped by routing
  key (direct and topic exchanges) or in one flat list (fanout). Use the
  small **×** on any row to unbind.
- **Match preview** — enter a routing key and click **Preview** to see
  which queues a message published with that key would reach. For fanout
  exchanges the match is immediate (every bound queue).
- **Delete** the exchange (only when no queues are bound).

### Namespaces

A namespace is a grouping for related queues and exchanges. The
Namespaces page shows one card per namespace with counters for each
side, and shortcut links to filtered lists.

Clicking **Queues** or **Exchanges** on a card filters the respective
list by that namespace.

Deleting a namespace requires that it be _empty_ — every queue must be
message-free with no active consumers, and no exchange may have bound
queues.

### Configuration

Read or edit the runtime RedisSMQ configuration:

- **Namespace** — the default namespace used when a queue or exchange is
  created without one.
- **Logger** — enabled/disabled, log level (Debug/Info/Warn/Error),
  colorization, timestamp inclusion.
- **Message audit** — three independent settings:
  - _Acknowledged messages_ — whether to keep a history of acked
    messages, with a queue size and expiry.
  - _Dead-lettered messages_ — same, for dead-lettered.
  - _Unacknowledgement history_ — whether to record why messages were
    unacknowledged, with a maximum history size.

Some Configuration changes take effect immediately; the logger level
affects only _future_ log output.

---

## Common tasks

### I want to verify a message actually arrived

1. Go to **Queues**, click the queue you published to.
2. Under **Message statistics**, check the Pending or Scheduled count.
3. Click **View messages** and confirm the row is present.

### I want to test a producer quickly

1. Go to **Messages** on any queue.
2. Click **Publish**.
3. Paste a body (JSON or plain text) and click **Publish**.
4. Copy the message ID or click **Go to queue**.

### I want to pause a queue for maintenance

1. Open the queue's detail page.
2. Click **Pause**.
3. Optionally pick a reason (Scheduled maintenance, Emergency) and add a
   description.
4. Click **Pause queue**.

The banner across the top shows the pause state until you **Resume**.

### I want to route messages via an exchange

1. Open **Exchanges** and click **Create exchange**. Choose type and
   queue policy.
2. From the exchange's card, click **Bind queue**, pick a queue, and
   (for direct/topic) enter a routing key or pattern.
3. Publish with **Through exchange** selected, providing the routing
   key.
4. Use the **Match preview** on the exchange's detail page to sanity-check
   which queues would receive a given key.

### I want to see why a message was dead-lettered

1. Open the queue's **Dead-lettered** messages tab.
2. Click the message.
3. Check the **Timeline** tab for the failure reason and attempt count,
   and the **Unack history** tab for the specific cause (if
   unacknowledgement history is enabled in Configuration).

### I want to requeue all dead-lettered messages

1. Open the **Dead-lettered** tab.
2. Tick the master checkbox in the row list (or select rows individually).
3. Use the message-detail **Requeue** button — bulk requeue is not
   supported by RedisSMQ, so repeat per message.

### I want to clear a queue completely

1. Open the queue's **Messages** view.
2. Click **Purge**.
3. Leave scope as _Published messages_ (= _all messages_).
4. Tick the acknowledgement checkbox.
5. Confirm.

Watch the progress indicator; you can cancel mid-run.

---

## Troubleshooting

### "API unreachable" in the footer

The browser can't reach the REST API. Confirm:

- The API server is running.
- The URL it's expecting matches where the server is listening. On a
  fresh install this is configured during startup; if you moved
  servers, the Web UI build may need the `VITE_API_URL` environment
  variable updated.

Click the indicator to re-check without reloading.

### A queue shows "Locked" and I can't pause or resume

The queue is being operated on by the server (a purge, a state
transition, or a background job). Wait for the lock to release.

### "NamespaceNotFoundError" on a URL I bookmarked

The namespace no longer exists. This happens when its last queue and
last exchange were deleted. Use the top navigation to reach a page that
still exists.

### A message shows Pending but no consumer picks it up

Check the queue's **Active consumers** card. If it shows zero, no
consumer application is connected. Start your consumer process and
refresh.

If consumers are connected but the queue is Paused or Stopped, resume
the queue from its detail page.

### My purge deleted more than I expected

The default scope **Published messages** means _every message regardless
of status_, not "messages currently in pending state". If you want a
narrower scope, choose Pending, Scheduled, Dead-lettered, or Acknowledged
before confirming.

### A confirmation dialog keeps failing

Some operations refuse while preconditions are unmet:

| Error                          | Cause                                                      |
| ------------------------------ | ---------------------------------------------------------- |
| `QueueNotEmptyError`           | Queue still has messages. Purge first.                     |
| `QueueHasActiveConsumersError` | A consumer is still connected. Stop your consumer process. |
| `QueueHasBoundExchangesError`  | The queue is still bound to an exchange. Unbind it.        |
| `ExchangeHasBoundQueuesError`  | The exchange still has queues bound. Unbind them.          |
| `ConsumerGroupNotEmptyError`   | The group still has pending messages. Purge them.          |

These all surface inline in the confirmation modal.

### Unack history is empty when I expected entries

The **Unacknowledgement history** feature is disabled by default.
Enable it from **Configuration → Message audit** and try again.

---

## License

RedisSMQ Web UI is released under the [MIT License](../../LICENSE).
