[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueAcknowledgedMessages

# Class: QueueAcknowledgedMessages

Manages acknowledged messages in a queue.

Acknowledged messages are those that have been successfully processed by consumers
and can be safely removed from the active queue. This class allows for tracking
and management of these messages when the system is configured to audit them.

## See

/packages/redis-smq/docs/configuration.md#message-audit

## Extends

- `QueueMessagesAbstract`

## Constructors

### Constructor

> **new QueueAcknowledgedMessages**(): `QueueAcknowledgedMessages`

#### Returns

`QueueAcknowledgedMessages`

#### Inherited from

`QueueMessagesAbstract.constructor`

## Properties

### messageType

> `readonly` **messageType**: [`ACKNOWLEDGED`](../enumerations/EQueueMessageType.md#acknowledged) = `EQueueMessageType.ACKNOWLEDGED`

Type of queue messages this browser handles.

#### Overrides

`QueueMessagesAbstract.messageType`

## Methods

### cancelPurge()

#### Call Signature

> **cancelPurge**(`queue`, `jobId`): `Promise`\<`void`\>

Cancels an active purge job that is currently in progress.

This method attempts to cancel a running purge operation. Cancellation is
asynchronous and may not be immediate, especially if the purge is already
in the middle of deleting a large batch of messages.

**Important Notes:**

- Completed or failed jobs cannot be cancelled
- Cancellation requests are processed asynchronously
- After cancellation, the queue may be partially purged

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### jobId

`string`

The ID of the purge job to cancel (returned from `purge()`)

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the specified job ID doesn't exist.

##### Throws

When the job cannot be cancelled (already completed or failed).

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
const jobId = await pendingMessages.purge('my-queue');

// Cancel after 2 seconds
setTimeout(() => {
  pendingMessages.cancelPurge('my-queue', jobId, (err) => {
    if (err) {
      console.error('Failed to cancel purge:', err);
    } else {
      console.log('Purge job cancelled');
    }
  });
}, 2000);

// Promise pattern with status checking
async function cancelIfRunning(queue: string, jobId: string) {
  try {
    const status = await pendingMessages.getPurgeJobStatus(queue, jobId);
    if (status === EBackgroundJobStatus.PROCESSING) {
      await pendingMessages.cancelPurge(queue, jobId);
      console.log('Purge job cancelled');
    } else {
      console.log('Job is not running, cannot cancel');
    }
  } catch (err) {
    console.error('Failed to cancel purge:', err);
  }
}
```

##### Inherited from

`QueueMessagesAbstract.cancelPurge`

#### Call Signature

> **cancelPurge**(`queue`, `jobId`, `cb`): `void`

Cancels an active purge job that is currently in progress.

This method attempts to cancel a running purge operation. Cancellation is
asynchronous and may not be immediate, especially if the purge is already
in the middle of deleting a large batch of messages.

**Important Notes:**

- Completed or failed jobs cannot be cancelled
- Cancellation requests are processed asynchronously
- After cancellation, the queue may be partially purged

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### jobId

`string`

The ID of the purge job to cancel (returned from `purge()`)

###### cb

`ICallback`

Optional callback function invoked when cancellation is processed. - On success: `cb(null)` - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves when cancelled.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the specified job ID doesn't exist.

##### Throws

When the job cannot be cancelled (already completed or failed).

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
const jobId = await pendingMessages.purge('my-queue');

// Cancel after 2 seconds
setTimeout(() => {
  pendingMessages.cancelPurge('my-queue', jobId, (err) => {
    if (err) {
      console.error('Failed to cancel purge:', err);
    } else {
      console.log('Purge job cancelled');
    }
  });
}, 2000);

// Promise pattern with status checking
async function cancelIfRunning(queue: string, jobId: string) {
  try {
    const status = await pendingMessages.getPurgeJobStatus(queue, jobId);
    if (status === EBackgroundJobStatus.PROCESSING) {
      await pendingMessages.cancelPurge(queue, jobId);
      console.log('Purge job cancelled');
    } else {
      console.log('Job is not running, cannot cancel');
    }
  } catch (err) {
    console.error('Failed to cancel purge:', err);
  }
}
```

##### Inherited from

`QueueMessagesAbstract.cancelPurge`

---

### countMessages()

#### Call Signature

> **countMessages**(`queue`): `Promise`\<`number`\>

Counts the total number of messages in the queue.

This method provides a quick way to get the total count of messages
of the specific type (pending, acknowledged, etc.) in a queue.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

##### Returns

`Promise`\<`number`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.countMessages('my-queue', (err, count) => {
  if (err) {
    console.error('Failed to count:', err);
  } else {
    console.log(`Queue has ${count} pending messages`);
  }
});

// Promise pattern
try {
  const count = await pendingMessages.countMessages('my-queue');
  console.log(`Queue has ${count} pending messages`);
} catch (err) {
  console.error('Failed to count:', err);
}
```

##### Inherited from

`QueueMessagesAbstract.countMessages`

#### Call Signature

> **countMessages**(`queue`, `cb`): `void`

Counts the total number of messages in the queue.

This method provides a quick way to get the total count of messages
of the specific type (pending, acknowledged, etc.) in a queue.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### cb

`ICallback`\<`number`\>

Optional callback function invoked with the message count. - On success: `cb(null, count)` where count is the total number of messages. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the count.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.countMessages('my-queue', (err, count) => {
  if (err) {
    console.error('Failed to count:', err);
  } else {
    console.log(`Queue has ${count} pending messages`);
  }
});

// Promise pattern
try {
  const count = await pendingMessages.countMessages('my-queue');
  console.log(`Queue has ${count} pending messages`);
} catch (err) {
  console.error('Failed to count:', err);
}
```

##### Inherited from

`QueueMessagesAbstract.countMessages`

---

### getMessageIds()

#### Call Signature

> **getMessageIds**(`queue`, `page`, `pageSize`): `Promise`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<`string`\>\>

Retrieves message IDs for a specific page.

This method returns a paginated list of message IDs from the queue,
allowing you to browse through messages efficiently without loading
full message content.

**Pagination:**

- Page numbers start from 1 (first page)
- Each page contains up to `pageSize` items
- Returns `IBrowserPage` containing the message IDs and pagination metadata

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### page

`number`

Page number (1 = first page)

###### pageSize

`number`

Number of items per page (must be positive)

##### Returns

`Promise`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<`string`\>\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When page number is invalid.

##### Throws

When page size is invalid.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.getMessageIds('my-queue', 1, 10, (err, page) => {
  if (err) {
    console.error('Failed to get message IDs:', err);
  } else {
    console.log(`Page ${page.page}: ${page.items.length} messages`);
    console.log('Message IDs:', page.items);
    console.log(`Next page: ${page.nextPage}`);
  }
});

// Promise pattern
try {
  const page = await pendingMessages.getMessageIds('my-queue', 1, 10);
  console.log(`Found ${page.total} total messages`);
  page.items.forEach((id) => console.log('Message ID:', id));

  // Load next page if available
  if (page.nextPage !== null) {
    const nextPage = await pendingMessages.getMessageIds(
      'my-queue',
      page.nextPage,
      10,
    );
    console.log(`Next page has ${nextPage.items.length} messages`);
  }
} catch (err) {
  console.error('Failed to get message IDs:', err);
}
```

##### Inherited from

`QueueMessagesAbstract.getMessageIds`

#### Call Signature

> **getMessageIds**(`queue`, `page`, `pageSize`, `cb`): `void`

Retrieves message IDs for a specific page.

This method returns a paginated list of message IDs from the queue,
allowing you to browse through messages efficiently without loading
full message content.

**Pagination:**

- Page numbers start from 1 (first page)
- Each page contains up to `pageSize` items
- Returns `IBrowserPage` containing the message IDs and pagination metadata

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### page

`number`

Page number (1 = first page)

###### pageSize

`number`

Number of items per page (must be positive)

###### cb

`ICallback`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<`string`\>\>

Optional callback function invoked with the paginated message IDs. - On success: `cb(null, page)` where page contains message IDs and pagination info. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the page.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When page number is invalid.

##### Throws

When page size is invalid.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.getMessageIds('my-queue', 1, 10, (err, page) => {
  if (err) {
    console.error('Failed to get message IDs:', err);
  } else {
    console.log(`Page ${page.page}: ${page.items.length} messages`);
    console.log('Message IDs:', page.items);
    console.log(`Next page: ${page.nextPage}`);
  }
});

// Promise pattern
try {
  const page = await pendingMessages.getMessageIds('my-queue', 1, 10);
  console.log(`Found ${page.total} total messages`);
  page.items.forEach((id) => console.log('Message ID:', id));

  // Load next page if available
  if (page.nextPage !== null) {
    const nextPage = await pendingMessages.getMessageIds(
      'my-queue',
      page.nextPage,
      10,
    );
    console.log(`Next page has ${nextPage.items.length} messages`);
  }
} catch (err) {
  console.error('Failed to get message IDs:', err);
}
```

##### Inherited from

`QueueMessagesAbstract.getMessageIds`

---

### getMessages()

#### Call Signature

> **getMessages**(`queue`, `page`, `pageSize`): `Promise`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

Retrieves detailed messages for a specific page.

This method returns a paginated list of complete message objects,
including all message metadata and content.

**Pagination:**

- Page numbers start from 1 (first page)
- Each page contains up to `pageSize` items
- Returns `IBrowserPage` containing full message objects and pagination metadata

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### page

`number`

Page number (1 = first page)

###### pageSize

`number`

Number of items per page (must be positive)

##### Returns

`Promise`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When page number is invalid.

##### Throws

When page size is invalid.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern - inspect messages
pendingMessages.getMessages('my-queue', 1, 5, (err, page) => {
  if (err) {
    console.error('Failed to get messages:', err);
  } else {
    page.items.forEach((msg) => {
      console.log(`Message ${msg.getId()}:`);
      console.log(`  Body:`, msg.getBody());
      console.log(`  Published:`, msg.getMessageState().getPublishedAt());
    });
  }
});

// Promise pattern - process all messages
async function browseAllMessages(queue: string) {
  let currentPage = 1;
  const pageSize = 20;
  let hasMore = true;

  while (hasMore) {
    const page = await pendingMessages.getMessages(
      queue,
      currentPage,
      pageSize,
    );
    console.log(
      `Processing page ${currentPage} with ${page.items.length} messages`,
    );

    for (const msg of page.items) {
      await processMessage(msg);
    }

    hasMore = page.nextPage !== null;
    currentPage++;
  }
}

// Export messages to file
const page = await pendingMessages.getMessages('my-queue', 1, 1000);
const messages = page.items.map((msg) => ({
  id: msg.getId(),
  body: msg.getBody(),
  timestamp: msg.getMessageState().getPublishedAt(),
}));
await fs.writeFile('messages.json', JSON.stringify(messages, null, 2));
```

##### Inherited from

`QueueMessagesAbstract.getMessages`

#### Call Signature

> **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

Retrieves detailed messages for a specific page.

This method returns a paginated list of complete message objects,
including all message metadata and content.

**Pagination:**

- Page numbers start from 1 (first page)
- Each page contains up to `pageSize` items
- Returns `IBrowserPage` containing full message objects and pagination metadata

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### page

`number`

Page number (1 = first page)

###### pageSize

`number`

Number of items per page (must be positive)

###### cb

`ICallback`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

Optional callback function invoked with the paginated messages. - On success: `cb(null, page)` where page contains message objects and pagination info. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the page.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When page number is invalid.

##### Throws

When page size is invalid.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern - inspect messages
pendingMessages.getMessages('my-queue', 1, 5, (err, page) => {
  if (err) {
    console.error('Failed to get messages:', err);
  } else {
    page.items.forEach((msg) => {
      console.log(`Message ${msg.getId()}:`);
      console.log(`  Body:`, msg.getBody());
      console.log(`  Published:`, msg.getMessageState().getPublishedAt());
    });
  }
});

// Promise pattern - process all messages
async function browseAllMessages(queue: string) {
  let currentPage = 1;
  const pageSize = 20;
  let hasMore = true;

  while (hasMore) {
    const page = await pendingMessages.getMessages(
      queue,
      currentPage,
      pageSize,
    );
    console.log(
      `Processing page ${currentPage} with ${page.items.length} messages`,
    );

    for (const msg of page.items) {
      await processMessage(msg);
    }

    hasMore = page.nextPage !== null;
    currentPage++;
  }
}

// Export messages to file
const page = await pendingMessages.getMessages('my-queue', 1, 1000);
const messages = page.items.map((msg) => ({
  id: msg.getId(),
  body: msg.getBody(),
  timestamp: msg.getMessageState().getPublishedAt(),
}));
await fs.writeFile('messages.json', JSON.stringify(messages, null, 2));
```

##### Inherited from

`QueueMessagesAbstract.getMessages`

---

### getPurgeJob()

#### Call Signature

> **getPurgeJob**(`queue`, `jobId`): `Promise`\<[`IBackgroundJob`](../interfaces/IBackgroundJob.md)\<[`TPurgeQueueJobTarget`](../type-aliases/TPurgeQueueJobTarget.md)\>\>

Retrieves comprehensive details about a specific purge job.

This method returns the full background job object, including metadata,
target information, timestamps, and any error messages if the job failed.

**Job Information Includes:**

- Job ID and type
- Current status (pending, processing, completed, failed, cancelled)
- Target queue information
- Creation and completion timestamps
- Error details if job failed
- Progress information (if available)

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### jobId

`string`

The ID of the purge job to retrieve

##### Returns

`Promise`\<[`IBackgroundJob`](../interfaces/IBackgroundJob.md)\<[`TPurgeQueueJobTarget`](../type-aliases/TPurgeQueueJobTarget.md)\>\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the specified job ID doesn't exist.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.getPurgeJob('my-queue', jobId, (err, job) => {
  if (err) {
    console.error('Failed to get job details:', err);
  } else {
    console.log('Job details:');
    console.log(`  ID: ${job.id}`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Created: ${new Date(job.createdAt)}`);
    console.log(
      `  Target queue: ${job.target.queue.name}@${job.target.queue.ns}`,
    );
    if (job.status === EBackgroundJobStatus.FAILED) {
      console.log(`  Error: ${job.error}`);
    }
  }
});

// Promise pattern with monitoring
async function monitorPurgeJob(queue: string, jobId: string) {
  try {
    const job = await pendingMessages.getPurgeJob(queue, jobId);
    console.log(`Purge job status: ${job.status}`);

    if (job.status === EBackgroundJobStatus.COMPLETED) {
      console.log('Purge completed successfully');
      return true;
    }

    if (job.status === EBackgroundJobStatus.FAILED) {
      console.error(`Purge failed: ${job.error}`);
      return false;
    }

    return null; // Still in progress
  } catch (err) {
    console.error('Failed to monitor job:', err);
    return false;
  }
}
```

##### Inherited from

`QueueMessagesAbstract.getPurgeJob`

#### Call Signature

> **getPurgeJob**(`queue`, `jobId`, `cb`): `void`

Retrieves comprehensive details about a specific purge job.

This method returns the full background job object, including metadata,
target information, timestamps, and any error messages if the job failed.

**Job Information Includes:**

- Job ID and type
- Current status (pending, processing, completed, failed, cancelled)
- Target queue information
- Creation and completion timestamps
- Error details if job failed
- Progress information (if available)

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### jobId

`string`

The ID of the purge job to retrieve

###### cb

`ICallback`\<[`IBackgroundJob`](../interfaces/IBackgroundJob.md)\<[`TPurgeQueueJobTarget`](../type-aliases/TPurgeQueueJobTarget.md)\>\>

Optional callback function invoked with the job details. - On success: `cb(null, job)` where job is the full job object. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the job.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the specified job ID doesn't exist.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.getPurgeJob('my-queue', jobId, (err, job) => {
  if (err) {
    console.error('Failed to get job details:', err);
  } else {
    console.log('Job details:');
    console.log(`  ID: ${job.id}`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Created: ${new Date(job.createdAt)}`);
    console.log(
      `  Target queue: ${job.target.queue.name}@${job.target.queue.ns}`,
    );
    if (job.status === EBackgroundJobStatus.FAILED) {
      console.log(`  Error: ${job.error}`);
    }
  }
});

// Promise pattern with monitoring
async function monitorPurgeJob(queue: string, jobId: string) {
  try {
    const job = await pendingMessages.getPurgeJob(queue, jobId);
    console.log(`Purge job status: ${job.status}`);

    if (job.status === EBackgroundJobStatus.COMPLETED) {
      console.log('Purge completed successfully');
      return true;
    }

    if (job.status === EBackgroundJobStatus.FAILED) {
      console.error(`Purge failed: ${job.error}`);
      return false;
    }

    return null; // Still in progress
  } catch (err) {
    console.error('Failed to monitor job:', err);
    return false;
  }
}
```

##### Inherited from

`QueueMessagesAbstract.getPurgeJob`

---

### getPurgeJobStatus()

#### Call Signature

> **getPurgeJobStatus**(`queue`, `jobId`): `Promise`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

Retrieves the current status of a purge job.

This method provides a quick way to check the status of a purge job
without fetching all job details. The status can be one of:

- `PENDING`: Job is queued but not yet started
- `PROCESSING`: Job is actively running
- `COMPLETED`: Job finished successfully
- `FAILED`: Job failed with an error
- `CANCELLED`: Job was cancelled

**Use Cases:**

- Polling for job completion
- Quick status checks in monitoring systems
- Building progress indicators
- Determining if a job can be cancelled

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### jobId

`string`

The ID of the purge job to check

##### Returns

`Promise`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the specified job ID doesn't exist.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.getPurgeJobStatus('my-queue', jobId, (err, status) => {
  if (err) {
    console.error('Failed to get status:', err);
  } else {
    console.log(`Job status: ${status}`);

    if (status === EBackgroundJobStatus.COMPLETED) {
      console.log('Queue has been purged');
    }
  }
});

// Promise pattern with polling
async function waitForPurgeCompletion(queue: string, jobId: string) {
  let status = await pendingMessages.getPurgeJobStatus(queue, jobId);

  while (
    status === EBackgroundJobStatus.PENDING ||
    status === EBackgroundJobStatus.PROCESSING
  ) {
    console.log(`Waiting for purge to complete... Current status: ${status}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    status = await pendingMessages.getPurgeJobStatus(queue, jobId);
  }

  if (status === EBackgroundJobStatus.COMPLETED) {
    console.log('Purge completed successfully!');
    return true;
  } else if (status === EBackgroundJobStatus.FAILED) {
    console.error('Purge failed');
    return false;
  } else {
    console.log(`Purge was ${status.toLowerCase()}`);
    return false;
  }
}

// Check status before cancelling
const status = await pendingMessages.getPurgeJobStatus('my-queue', jobId);
if (status === EBackgroundJobStatus.PROCESSING) {
  await pendingMessages.cancelPurge('my-queue', jobId);
  console.log('Purge cancelled');
} else {
  console.log('Cannot cancel: job is not running');
}
```

##### Inherited from

`QueueMessagesAbstract.getPurgeJobStatus`

#### Call Signature

> **getPurgeJobStatus**(`queue`, `jobId`, `cb`): `void`

Retrieves the current status of a purge job.

This method provides a quick way to check the status of a purge job
without fetching all job details. The status can be one of:

- `PENDING`: Job is queued but not yet started
- `PROCESSING`: Job is actively running
- `COMPLETED`: Job finished successfully
- `FAILED`: Job failed with an error
- `CANCELLED`: Job was cancelled

**Use Cases:**

- Polling for job completion
- Quick status checks in monitoring systems
- Building progress indicators
- Determining if a job can be cancelled

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### jobId

`string`

The ID of the purge job to check

###### cb

`ICallback`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

Optional callback function invoked with the job status. - On success: `cb(null, status)` where status is an enum value. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the status.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the specified job ID doesn't exist.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.getPurgeJobStatus('my-queue', jobId, (err, status) => {
  if (err) {
    console.error('Failed to get status:', err);
  } else {
    console.log(`Job status: ${status}`);

    if (status === EBackgroundJobStatus.COMPLETED) {
      console.log('Queue has been purged');
    }
  }
});

// Promise pattern with polling
async function waitForPurgeCompletion(queue: string, jobId: string) {
  let status = await pendingMessages.getPurgeJobStatus(queue, jobId);

  while (
    status === EBackgroundJobStatus.PENDING ||
    status === EBackgroundJobStatus.PROCESSING
  ) {
    console.log(`Waiting for purge to complete... Current status: ${status}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    status = await pendingMessages.getPurgeJobStatus(queue, jobId);
  }

  if (status === EBackgroundJobStatus.COMPLETED) {
    console.log('Purge completed successfully!');
    return true;
  } else if (status === EBackgroundJobStatus.FAILED) {
    console.error('Purge failed');
    return false;
  } else {
    console.log(`Purge was ${status.toLowerCase()}`);
    return false;
  }
}

// Check status before cancelling
const status = await pendingMessages.getPurgeJobStatus('my-queue', jobId);
if (status === EBackgroundJobStatus.PROCESSING) {
  await pendingMessages.cancelPurge('my-queue', jobId);
  console.log('Purge cancelled');
} else {
  console.log('Cannot cancel: job is not running');
}
```

##### Inherited from

`QueueMessagesAbstract.getPurgeJobStatus`

---

### purge()

#### Call Signature

> **purge**(`queue`): `Promise`\<`string`\>

Purges all messages from the specified queue.

This operation removes all messages of the specific type (pending, acknowledged, etc.)
from the queue. The operation is performed asynchronously using a background job
to avoid blocking the main thread, especially for large queues.

**Important Notes:**

- This operation is asynchronous and returns immediately with a job ID
- The purge continues in the background even if the application restarts
- Use the returned job ID to track progress and check completion
- Purge operations can be cancelled using `cancelPurge()`
- This operation is irreversible - messages cannot be recovered once purged

**Workflow:**

1. Call `purge()` to start the operation
2. Receive a job ID immediately
3. Use `getPurgeJobStatus()` to check progress
4. Use `getPurgeJob()` to get detailed job information
5. Use `cancelPurge()` if needed to stop an in-progress purge

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

##### Returns

`Promise`\<`string`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When a purge operation is already in progress.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.purge('my-queue', (err, jobId) => {
  if (err) {
    console.error('Failed to start purge:', err);
  } else {
    console.log('Purge job started with ID:', jobId);

    // Check status after 5 seconds
    setTimeout(() => {
      pendingMessages.getPurgeJobStatus('my-queue', jobId, (err, status) => {
        if (!err) {
          console.log('Purge job status:', status);
        }
      });
    }, 5000);
  }
});

// Promise pattern with status monitoring
async function purgeQueue(queue: string) {
  try {
    const jobId = await pendingMessages.purge(queue);
    console.log(`Purge job started: ${jobId}`);

    // Poll for completion
    let status = EBackgroundJobStatus.PENDING;
    while (
      status === EBackgroundJobStatus.PENDING ||
      status === EBackgroundJobStatus.PROCESSING
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await pendingMessages.getPurgeJobStatus(queue, jobId);
      console.log(`Current status: ${status}`);
    }

    if (status === EBackgroundJobStatus.COMPLETED) {
      console.log('Queue purged successfully');
    } else {
      console.error('Purge job failed or was cancelled');
    }
  } catch (err) {
    console.error('Purge failed:', err);
  }
}

// Purge with custom namespace
const jobId = await pendingMessages.purge({
  ns: 'production',
  name: 'orders',
  groupId: 'group-1',
});
```

##### Inherited from

`QueueMessagesAbstract.purge`

#### Call Signature

> **purge**(`queue`, `cb`): `void`

Purges all messages from the specified queue.

This operation removes all messages of the specific type (pending, acknowledged, etc.)
from the queue. The operation is performed asynchronously using a background job
to avoid blocking the main thread, especially for large queues.

**Important Notes:**

- This operation is asynchronous and returns immediately with a job ID
- The purge continues in the background even if the application restarts
- Use the returned job ID to track progress and check completion
- Purge operations can be cancelled using `cancelPurge()`
- This operation is irreversible - messages cannot be recovered once purged

**Workflow:**

1. Call `purge()` to start the operation
2. Receive a job ID immediately
3. Use `getPurgeJobStatus()` to check progress
4. Use `getPurgeJob()` to get detailed job information
5. Use `cancelPurge()` if needed to stop an in-progress purge

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters (string name or object with ns/name/groupId)

###### cb

`ICallback`\<`string`\>

Optional callback function invoked with the purge job ID. - On success: `cb(null, jobId)` where jobId is the ID of the background purge job. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the job ID.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When a purge operation is already in progress.

##### Example

```typescript
const pendingMessages = new QueuePendingMessages();

// Callback pattern
pendingMessages.purge('my-queue', (err, jobId) => {
  if (err) {
    console.error('Failed to start purge:', err);
  } else {
    console.log('Purge job started with ID:', jobId);

    // Check status after 5 seconds
    setTimeout(() => {
      pendingMessages.getPurgeJobStatus('my-queue', jobId, (err, status) => {
        if (!err) {
          console.log('Purge job status:', status);
        }
      });
    }, 5000);
  }
});

// Promise pattern with status monitoring
async function purgeQueue(queue: string) {
  try {
    const jobId = await pendingMessages.purge(queue);
    console.log(`Purge job started: ${jobId}`);

    // Poll for completion
    let status = EBackgroundJobStatus.PENDING;
    while (
      status === EBackgroundJobStatus.PENDING ||
      status === EBackgroundJobStatus.PROCESSING
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await pendingMessages.getPurgeJobStatus(queue, jobId);
      console.log(`Current status: ${status}`);
    }

    if (status === EBackgroundJobStatus.COMPLETED) {
      console.log('Queue purged successfully');
    } else {
      console.error('Purge job failed or was cancelled');
    }
  } catch (err) {
    console.error('Purge failed:', err);
  }
}

// Purge with custom namespace
const jobId = await pendingMessages.purge({
  ns: 'production',
  name: 'orders',
  groupId: 'group-1',
});
```

##### Inherited from

`QueueMessagesAbstract.purge`
