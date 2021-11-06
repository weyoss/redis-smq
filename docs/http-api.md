# HTTP API Reference

> ☝️ **Important Note**: The HTTP API is stable. Currently, it is under heavy development with frequent, 
> maybe breaking, API changes. Semantic versioning is implemented by all releases. Before upgrading to a major release, 
> always referer to the migration guide.

This is the backend part of the [RedisSMQ Monitor](https://github.com/weyoss/redis-smq-monitor). 

In contrast to system/core functionalities and features, which use pure callbacks for asynchronous tasks, the HTTP API 
server has been implemented using async/await. 

The HTTP API allows:

- Serving the SPA frontend application (UI).
- Providing "real-time" statistical data about various RedisSMQ metrics through WebSocket.
- Providing an interface to interact with and manage the MQ.

## Table of Content

1. Queues
   1. [GET /queues](#get-queues)
2. Acknowledged Messages
   1. [GET /queues/:queueName/acknowledged-messages/](#get-queuesqueuenameacknowledged-messages)
   2. [DELETE /queues/:queueName/acknowledged-messages/](#delete-queuesqueuenameacknowledged-messages)
   3. [DELETE /queues/:queueName/acknowledged-messages/:id](#delete-queuesqueuenameacknowledged-messagesid)
   4. [POST /queues/:queueName/acknowledged-messages/:id/requeue](#post-queuesqueuenameacknowledged-messagesidrequeue)
3. Dead-lettered Messages
   1. [GET /queues/:queueName/dead-lettered-messages/](#get-queuesqueuenamedead-lettered-messages)
   2. [DELETE /queues/:queueName/dead-lettered-messages](#delete-queuesqueuenamedead-lettered-messages)
   3. [DELETE /queues/:queueName/dead-lettered-messages/:id](#delete-queuesqueuenamedead-lettered-messagesid)
   4. [POST /queues/:queueName/dead-lettered-messages/:id/requeue](#post-queuesqueuenamedead-lettered-messagesidrequeue)
4. Pending Messages
   1. [GET /queues/:queueName/pending-messages/](#get-queuesqueuenamepending-messages)
   2. [DELETE /queues/:queueName/pending-messages/](#delete-queuesqueuenamepending-messages)
   3. [DELETE /queues/:queueName/pending-messages/:id](#delete-queuesqueuenamepending-messagesid)
5. Pending Messages with Priority
   1. [GET /queues/:queueName/pending-priority-messages/](#get-queuesqueuenamepending-priority-messages)
   2. [DELETE /queues/:queueName/pending-priority-messages/](#delete-queuesqueuenamepending-priority-messages)
   3. [DELETE /queues/:queueName/pending-priority-messages/:id](#delete-queuesqueuenamepending-priority-messagesid)
6. Scheduled Messages
   1. [GET /scheduled-messages](#get-scheduled-messages)
   2. [DELETE /scheduled-messages](#delete-scheduled-messages)
   3. [DELETE /scheduled-messages/:id](#delete-scheduled-messagesid)
   
## Queues

### GET /queues

**Query parameters**

* `skip` (number): Optional. Offset from where messages should be taken. Starts from 0. 
* `take` (number): Optional. Max number of messages that should be taken. Starts from 1.

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

## Acknowledged Messages

### GET /queues/:queueName/acknowledged-messages

**Path parameters**

* `queueName` (string): Required. Queue name.

**Query parameters**

* `ns` (string): Required. Queue namespace.
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
            "scheduledPeriod": null,
            "scheduledRepeat": 0,
            "scheduledCronFired": false,
            "attempts": 0,
            "scheduledRepeatCount": 0,
            "delayed": false,
            "expired": false,
            "queueName": "test_queue",
            "createdAt": 1635702165317,
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

### DELETE /queues/:queueName/acknowledged-messages

**Path parameters**

* `queueName` (string): Required. Queue name.

**Query parameters**

* `ns` (string): Required. Queue namespace.

**Response Body**

```text
204 No Content
```

### DELETE /queues/:queueName/acknowledged-messages/:id

**Path parameters**

* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `ns` (string): Required. Queue namespace.
* `sequenceId` (number): Required. Message sequence ID.

**Response Body**

```text
204 No Content
```

### POST /queues/:queueName/acknowledged-messages/:id/requeue

**Path parameters**

* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `ns` (string): Required. Queue namespace.
* `sequenceId` (number): Required. Message sequence ID.
* `priority` (number): Optional. Message priority. When provided, the message will be re-queued with priority.

**Response Body**

```text
204 No Content
```

## Dead-lettered Messages

### GET /queues/:queueName/dead-lettered-messages

**Path parameters**

* `queueName` (string): Required. Queue name.

**Query parameters**

* `ns` (string): Required. Queue namespace.
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
            "scheduledPeriod": null,
            "scheduledRepeat": 0,
            "scheduledCronFired": false,
            "attempts": 2,
            "scheduledRepeatCount": 0,
            "delayed": false,
            "expired": false,
            "queueName": "test_queue",
            "createdAt": 1635702165317,
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

### DELETE /queues/:queueName/dead-lettered-messages

**Path parameters**

* `queueName` (string): Required. Queue name.

**Query parameters**

* `ns` (string): Required. Queue namespace.

**Response Body**

```text
204 No Content
```

### DELETE /queues/:queueName/dead-lettered-messages/:id

**Path parameters**

* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `ns` (string): Required. Queue namespace.
* `sequenceId` (number): Required. Message sequence ID.

**Response Body**

```text
204 No Content
```

### POST /queues/:queueName/dead-lettered-messages/:id/requeue

**Path parameters**

* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `ns` (string): Required. Queue namespace.
* `sequenceId` (number): Required. Message sequence ID.
* `priority` (number): Optional. Message priority. When provided, the message will be re-queued with priority.

**Response Body**

```text
204 No Content
```

## Pending Messages

### GET /queues/:queueName/pending-messages


**Path parameters**

* `queueName` (string): Required. Queue name.

**Query parameters**

* `ns` (string): Required. Queue namespace.
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
            "scheduledPeriod": null,
            "scheduledRepeat": 0,
            "scheduledCronFired": false,
            "attempts": 0,
            "scheduledRepeatCount": 0,
            "delayed": false,
            "expired": false,
            "queueName": "test_queue",
            "createdAt": 1635702165317,
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

### DELETE /queues/:queueName/pending-messages

**Path parameters**

* `queueName` (string): Required. Queue name.

**Query parameters**

* `ns` (string): Required. Queue namespace.

**Response Body**

```text
204 No Content
```

### DELETE /queues/:queueName/pending-messages/:id

**Path parameters**

* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `ns` (string): Required. Queue namespace.
* `sequenceId` (number): Required. Message sequence ID.

**Response Body**

```text
204 No Content
```

## Pending Messages with Priority

### GET /queues/:queueName/pending-priority-messages

**Path parameters**

* `queueName` (string): Required. Queue name.

**Query parameters**

* `ns` (string): Required. Queue namespace.
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
            "priority": 4,
            "scheduledCron": null,
            "scheduledDelay": null,
            "scheduledPeriod": null,
            "scheduledRepeat": 0,
            "scheduledCronFired": false,
            "attempts": 0,
            "scheduledRepeatCount": 0,
            "delayed": false,
            "expired": false,
            "queueName": "test_queue",
            "createdAt": 1635702165317,
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

### DELETE /queues/:queueName/pending-priority-messages

**Path parameters**

* `queueName` (string): Required. Queue name.

**Query parameters**

* `ns` (string): Required. Queue namespace.

**Response Body**

```text
204 No Content
```

### DELETE /queues/:queueName/pending-priority-messages/:id

**Path parameters**

* `queueName` (string): Required. Queue name.
* `id` (string): Required. Message ID.

**Query parameters**

* `ns` (string): Required. Queue namespace.
* `sequenceId` (number): Required. Message sequence ID.

**Response Body**

```text
204 No Content
```

## Scheduled Messages

### GET /scheduled-messages

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
            "scheduledPeriod": 10000,
            "scheduledRepeat": 6,
            "scheduledCronFired": false,
            "attempts": 0,
            "scheduledRepeatCount": 0,
            "delayed": false,
            "expired": false,
            "queueName": "test_queue",
            "createdAt": 1635702165317,
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

### DELETE /scheduled-messages

**Path parameters**

* `queueName` (string): Required. Queue name.

**Response Body**

```text
204 No Content
```

### DELETE /scheduled-messages/:id

**Path parameters**

* `id` (string): Required. Message ID.

**Query parameters**

* `sequenceId` (number): Required. Message sequence ID.

**Response Body**

```text
204 No Content
```