> [RedisSMQ](../README.md) / [Docs](README.md) / ESM & CJS Modules

# ESM & CJS Modules

Nowadays, ES modules (ESM) are the official standard packaging format for both backend and frontend JavaScript
applications. Nevertheless, CommonJS modules (CJS) are still very popular and used by many NPM packages.

Official RedisSMQ packages are distributed in both ESM & CJS formats to allow developers to choose the right module
system depending on their applications.

## Using RedisSMQ as an ESM Module

```javascript
import { Queue, EQueueType } from 'redis-smq';

const queue = new Queue();

// Creating a LIFO queue
queue.save('my_queue', EQueueType.LIFO_QUEUE, (err) => console.log(err));
```

## Using RedisSMQ as an CJS Module

```javascript
const { Queue, EQueueType } = require('redis-smq');

const queue = new Queue();

// Creating a LIFO queue
queue.save('my_queue', EQueueType.LIFO_QUEUE, (err) => console.log(err));
```
