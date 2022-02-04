# HTTP API Reference

This is the backend part of the [Web UI](/docs/web-ui.md). 

In contrast to system core features, which use pure callbacks for asynchronous tasks, the HTTP API server has been implemented 
using async/await. 

The HTTP API allows:

- Serving the SPA frontend application (UI).
- Providing "real-time" statistical data about various RedisSMQ metrics through WebSocket.
- Providing an interface to interact with and manage the MQ.

To start using the HTTP API, you should first [configure and launch the Web UI](/docs/web-ui.md).

## Table of Content

1. Queues
   1. [GET /api/queues](#get-apiqueues)
   2. [DELETE /api/queues/:queueName/ns/:ns](#delete-apiqueuesqueuenamensns)
2. Acknowledged Messages
   1. [GET /api/queues/:queueName/ns/:ns/acknowledged-messages](#get-apiqueuesqueuenamensnsacknowledged-messages)
   2. [DELETE /api/queues/:queueName/ns/:ns/acknowledged-messages](#delete-apiqueuesqueuenamensnsacknowledged-messages)
   3. [DELETE /api/queues/:queueName/ns/:ns/acknowledged-messages/:id](#delete-apiqueuesqueuenamensnsacknowledged-messagesid)
   4. [POST /api/queues/:queueName/ns/:ns/acknowledged-messages/:id/requeue](#post-apiqueuesqueuenamensnsacknowledged-messagesidrequeue)
3. Dead-lettered Messages
   1. [GET /api/queues/:queueName/ns/:ns/dead-lettered-messages](#get-apiqueuesqueuenamensnsdead-lettered-messages)
   2. [DELETE /api/queues/:queueName/ns/:ns/dead-lettered-messages](#delete-apiqueuesqueuenamensnsdead-lettered-messages)
   3. [DELETE /api/queues/:queueName/ns/:ns/dead-lettered-messages/:id](#delete-apiqueuesqueuenamensnsdead-lettered-messagesid)
   4. [POST /api/queues/:queueName/ns/:ns/dead-lettered-messages/:id/requeue](#post-apiqueuesqueuenamensnsdead-lettered-messagesidrequeue)
4. Pending Messages
   1. [GET /api/queues/:queueName/ns/:ns/pending-messages](#delete-apiqueuesqueuenamensnspending-messages)
   2. [DELETE /api/queues/:queueName/ns/:ns/pending-messages](#delete-apiqueuesqueuenamensnspending-messages)
   3. [DELETE /api/queues/:queueName/ns/:ns/pending-messages/:id](#delete-apiqueuesqueuenamensnspending-messagesid)
5. Pending Messages with Priority
   1. [GET /api/queues/:queueName/ns/:ns/pending-messages-with-priority](#get-apiqueuesqueuenamensnspending-messages-with-priority)
   2. [DELETE /api/queues/:queueName/ns/:ns/pending-messages-with-priority](#delete-apiqueuesqueuenamensnspending-messages-with-priority)
   3. [DELETE /api/queues/:queueName/ns/:ns/pending-messages-with-priority/:id](#delete-apiqueuesqueuenamensnspending-messages-with-priorityid)
6. Scheduled Messages
   1. [GET /api/main/scheduled-messages](#get-apimainscheduled-messages)
   2. [DELETE /api/main/scheduled-messages](#delete-apimainscheduled-messages)
   3. [DELETE /api/main/scheduled-messages/:id](#delete-apimainscheduled-messagesid)
   
## Queues

### GET /api/queues

**Response body**

```text
{
   "total": 3,
   "items": [
      {
         "ns": "my-application",
         "name": "notifications"
      },
      {
         "ns": "my-application",
         "name": "orders"
      },
      {
         "ns": "my-application",
         "name": "confirmation_emails"
      }
   ]
}
```

### DELETE /api/queues/:queueName/ns/:ns

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.

**Response Body**

```text
204 No Content
```

## Acknowledged Messages

### GET /api/queues/:queueName/ns/:ns/acknowledged-messages

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.

**Query parameters**

* `skip` (number): Optional. Offset from where messages should be taken. Starts from 0.
* `take` (number): Optional. Max number of messages that should be taken. Starts from 1.

**Response Body**

```text
{
   "total": 1,
   "items": [
      {
         "sequenceId": 0,
         "message": {
            "body": {
               "hello": "world"
            },
            "priority": null,
            "scheduledCron": null,
            "scheduledDelay": null,
            "scheduledRepeatPeriod": null,
            "scheduledRepeat": 0,
            "scheduledCronFired": false,
            "attempts": 0,
            "scheduledRepeatCount": 0,
            "delayed": false,
            "expired": false,
            "queue": {
               "ns": "my-application",
               "name": "test_queue"
            },
            "createdAt": 1635702165317,
            "publishedAt": 1737595989746,
            "scheduledAt": null,
            "uuid": "9e7b8046-200c-48de-aa9f-2caf0a172a83",
            "ttl": 0,
            "retryDelay": 0,
            "retryThreshold": 3,
            "consumeTimeout": 0
         }
      }
   ]
}
```

### DELETE /api/queues/:queueName/ns/:ns/acknowledged-messages

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.

**Response Body**

```text
204 No Content
```

### DELETE /api/queues/:queueName/ns/:ns/acknowledged-messages/:id

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `sequenceId` (number): Required. Message sequence ID.

**Response Body**

```text
204 No Content
```

### POST /api/queues/:queueName/ns/:ns/acknowledged-messages/:id/requeue

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `sequenceId` (number): Required. Message sequence ID.
* `priority` (number): Optional. Message priority. When provided, the message will be re-queued with priority.

**Response Body**

```text
204 No Content
```

## Dead-lettered Messages

### GET /api/queues/:queueName/ns/:ns/dead-lettered-messages

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.

**Query parameters**

* `skip` (number): Optional. Offset from where messages should be taken. Starts from 0.
* `take` (number): Optional. Max number of messages that should be taken. Starts from 1.

**Response Body**

```text
{
   "total": 1,
   "items": [
      {
         "sequenceId": 0,
         "message": {
            "body": { "hello": "world" },
            "priority": null,
            "scheduledCron": null,
            "scheduledDelay": null,
            "scheduledRepeatPeriod": null,
            "scheduledRepeat": 0,
            "scheduledCronFired": false,
            "attempts": 2,
            "scheduledRepeatCount": 0,
            "delayed": false,
            "expired": false,
            "queue": {
               "ns": "my-application",
               "name": "test_queue"
            },
            "createdAt": 1635702165317,
            "publishedAt": 1737595989746,
            "scheduledAt": 1637523400376,
            "uuid": "9e7b8046-200c-48de-aa9f-2caf0a172a83",
            "ttl": 0,
            "retryDelay": 0,
            "retryThreshold": 3,
            "consumeTimeout": 0
         }
      }
   ]
}
```

### DELETE /api/queues/:queueName/ns/:ns/dead-lettered-messages

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.

**Response Body**

```text
204 No Content
```

### DELETE /api/queues/:queueName/ns/:ns/dead-lettered-messages/:id

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `sequenceId` (number): Required. Message sequence ID.

**Response Body**

```text
204 No Content
```

### POST /api/queues/:queueName/ns/:ns/dead-lettered-messages/:id/requeue

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `sequenceId` (number): Required. Message sequence ID.
* `priority` (number): Optional. Message priority. When provided, the message will be re-queued with priority.

**Response Body**

```text
204 No Content
```

## Pending Messages

### GET /api/queues/:queueName/ns/:ns/pending-messages


**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.

**Query parameters**

* `skip` (number): Optional. Offset from where messages should be taken. Starts from 0.
* `take` (number): Optional. Max number of messages that should be taken. Starts from 1.

**Response Body**

```text
{
   "total": 1,
   "items": [
      {
         "sequenceId": 0,
         "message": {
            "body": { "hello": "world" },
            "priority": null,
            "scheduledCron": null,
            "scheduledDelay": null,
            "scheduledRepeatPeriod": null,
            "scheduledRepeat": 0,
            "scheduledCronFired": false,
            "attempts": 0,
            "scheduledRepeatCount": 0,
            "delayed": false,
            "expired": false,
            "queue": {
               "ns": "my-application",
               "name": "test_queue"
            },
            "createdAt": 1635702165317,
            "publishedAt": 1635702167654,
            "scheduledAt": null,
            "uuid": "9e7b8046-200c-48de-aa9f-2caf0a172a83",
            "ttl": 0,
            "retryDelay": 0,
            "retryThreshold": 3,
            "consumeTimeout": 0
         }
      }
   ]
}
```

### DELETE /api/queues/:queueName/ns/:ns/pending-messages

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.

**Response Body**

```text
204 No Content
```

### DELETE /api/queues/:queueName/ns/:ns/pending-messages/:id

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `sequenceId` (number): Required. Message sequence ID.

**Response Body**

```text
204 No Content
```

## Pending Messages with Priority

### GET /api/queues/:queueName/ns/:ns/pending-messages-with-priority

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.

**Query parameters**

* `skip` (number): Optional. Offset from where messages should be taken. Starts from 0.
* `take` (number): Optional. Max number of messages that should be taken. Starts from 1.

**Response Body**

```text
{
   "total": 1,
   "items": [
      {
         "body": { "hello": "world" },
         "priority": 4,
         "scheduledCron": null,
         "scheduledDelay": null,
         "scheduledRepeatPeriod": null,
         "scheduledRepeat": 0,
         "scheduledCronFired": false,
         "attempts": 0,
         "scheduledRepeatCount": 0,
         "delayed": false,
         "expired": false,
         "queue": {
            "ns": "my-application",
            "name": "test_queue"
         },
         "createdAt": 1635702165317,
         "publishedAt": 1635702167654,
         "scheduledAt": null,
         "uuid": "9e7b8046-200c-48de-aa9f-2caf0a172a83",
         "ttl": 0,
         "retryDelay": 0,
         "retryThreshold": 3,
         "consumeTimeout": 0
      }
   ]
}
```

### DELETE /api/queues/:queueName/ns/:ns/pending-messages-with-priority

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.

**Response Body**

```text
204 No Content
```

### DELETE /api/queues/:queueName/ns/:ns/pending-messages-with-priority/:id

**Path parameters**

* `ns` (string): Required. Queue namespace.
* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Response Body**

```text
204 No Content
```

## Scheduled Messages

### GET /api/main/scheduled-messages

**Query parameters**

* `skip` (number): Optional. Offset from where messages should be taken. Starts from 0.
* `take` (number): Optional. Max number of messages that should be taken. Starts from 1.

**Response Body**

```text
{
   "total": 1,
   "items": [
      {
         "body": { "hello": "world" },
         "priority": null,
         "scheduledCron": null,
         "scheduledDelay": null,
         "scheduledRepeatPeriod": 10000,
         "scheduledRepeat": 6,
         "scheduledCronFired": false,
         "attempts": 0,
         "scheduledRepeatCount": 0,
         "delayed": false,
         "expired": false,
         "queue": {
            "ns": "my-application",
            "name": "test_queue"
         },
         "createdAt": 1635702165317,
         "publishedAt": null,
         "scheduledAt": 1635702163487,
         "uuid": "9e7b8046-200c-48de-aa9f-2caf0a172a83",
         "ttl": 0,
         "retryDelay": 0,
         "retryThreshold": 3,
         "consumeTimeout": 0
      }
   ]
}
```

### DELETE /api/main/scheduled-messages

**Path parameters**

* `queueName` (string): Required. Queue name.

**Response Body**

```text
204 No Content
```

### DELETE /api/main/scheduled-messages/:id

**Path parameters**

* `id` (string): Required. Message ID.

**Response Body**

```text
204 No Content
```