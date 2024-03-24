[RedisSMQ](../README.md) / [Docs](README.md) / ESM & CJS Modules

# ESM & CJS Modules

Nowadays, ES modules (ESM) are the official standard packaging format for both backend and frontend JavaScript applications. Nevertheless, CommonJS modules (CJS) are still very popular and used by many NPM packages.

RedisSMQ packages are distributed in both ESM & CJS formats to allow developers to choose the right module system depending on their applications.

## Using RedisSMQ as an ESM Module

```javascript
import { Queue } from 'redis-smq';

const queue = new Queue();
```

## Using RedisSMQ as a CJS Module

```javascript
const { Queue } = require('redis-smq');

const queue = new Queue();
```
