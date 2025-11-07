[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / async

# Variable: async

> `const` **async**: `object`

A utility providing generic callback handling functions

This helper centralizes common callback patterns and error handling
to ensure consistent behavior across the application.

## Type Declaration

### each()

> **each**: \<`T`\>(`collection`, `iteratee`, `callback`) => `void`

Iterates over each element or property in a collection (array or object) asynchronously.

This function applies an iteratee function to each item or property in the collection
one at a time, in a non-blocking manner using setTimeout to prevent call stack overflow.
The iteration continues until all items or properties are processed or an error occurs.

#### Type Parameters

##### T

`T`

The type of elements or values in the collection

#### Parameters

##### collection

The array or object to iterate over

`Record`\<`string`, `T`\> | `T`[]

##### iteratee

(`item`, `key`, `callback`) => `void`

The function to apply to each item or property

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

The callback function called after all items or properties have been processed or when an error occurs

#### Returns

`void`

### eachIn()

> **eachIn**: \<`T`\>(`collection`, `iteratee`, `callback`) => `void`

Iterates over each property in an object asynchronously.

This function applies an iteratee function to each property in the object
one at a time, in a non-blocking manner using setTimeout to prevent call stack overflow.
The iteration continues until all properties are processed or an error occurs.

#### Type Parameters

##### T

`T`

The type of values in the object

#### Parameters

##### collection

`Record`\<`string`, `T`\>

The object to iterate over

##### iteratee

(`item`, `key`, `callback`) => `void`

The function to apply to each property

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

The callback function called after all properties have been processed or when an error occurs

#### Returns

`void`

### eachOf()

> **eachOf**: \<`T`\>(`collection`, `iteratee`, `callback`) => `void`

Iterates over each element in an array asynchronously.

This function applies an iteratee function to each item in the collection
one at a time, in a non-blocking manner using setTimeout to prevent call stack overflow.
The iteration continues until all items are processed or an error occurs.

#### Type Parameters

##### T

`T`

The type of elements in the array

#### Parameters

##### collection

`T`[]

The array to iterate over

##### iteratee

(`item`, `key`, `callback`) => `void`

The function to apply to each item

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

The callback function called after all items have been processed or when an error occurs

#### Returns

`void`

### exec()

> **exec**: \<`T`\>(`operation`, `callback`) => `void`

Executes an asynchronous operation with standardized error handling and logging

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

(`cb`) => `void`

The async operation to execute

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`T`\>

The callback to invoke with results

#### Returns

`void`

#### Typeparam

T - The type of data returned by the operation

### map()

> **map**: \<`T`, `R`\>(`items`, `operation`, `chunkSize`, `callback`) => `void`

Processes items in a collection using a specified operation

Items are processed in chunks to avoid memory issues with large collections.
Each chunk is processed in parallel, but chunks themselves are processed sequentially.

#### Type Parameters

##### T

`T`

##### R

`R`

#### Parameters

##### items

`T`[]

Collection of items to process

##### operation

(`item`, `cb`) => `void`

Operation to apply to each item

##### chunkSize

`number`

Size of chunks to process

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`R`[]\>

The callback to invoke with results

#### Returns

`void`

#### Typeparam

T - The type of items in the collection

#### Typeparam

R - The type of data returned as an array of results

#### Example

```javascript
// Example 1: Process a list of user IDs to fetch user data
const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];

map(
  userIds,
  (userId, cb) => {
    fetchUserData(userId, (err, userData) => {
      if (err) return cb(err);
      // Transform or validate the user data if needed
      return cb(null, {
        id: userData.id,
        name: userData.name,
        isActive: userData.status === 'active'
      });
    });
  },
  2, // Process 2 users at a time
  (err, users) => {
    if (err) {
      console.error('Failed to fetch user data:', err);
      return;
    }
    console.log(`Successfully processed ${users.length} users`);
    // users is an array of user objects
  }
);
```

### parallel()

> **parallel**: \<`AsyncOperationList`\>(`operations`, `callback`) => `void`

Executes multiple asynchronous operations in parallel

All operations are started simultaneously, and the callback is invoked
when all operations complete or when any operation fails.

#### Type Parameters

##### AsyncOperationList

`AsyncOperationList` *extends* [`TAsyncOperationList`](../type-aliases/TAsyncOperationList.md)

#### Parameters

##### operations

\[`...AsyncOperationList[]`\]

Array of operations to execute in parallel

##### callback

[`ICallback`](../interfaces/ICallback.md)\<[`MapAsyncOperationReturnTypeToResult`](../type-aliases/MapAsyncOperationReturnTypeToResult.md)\<`AsyncOperationList`\>\>

The callback to invoke with results

#### Returns

`void`

#### Examples

```javascript
// Example 1: Basic usage with different return types
parallel(
  [
    (cb) => fetchUserData(userId, cb),
    (cb) => fetchUserPosts(userId, cb)
  ],
  (err, results) => {
    if (err) {
      console.error('An error occurred:', err);
      return;
    }

    const [userData, userPosts] = results;
    // userData is of type UserData
    // userPosts is of type Post[]
    console.log(`User ${userData.name} has ${userPosts.length} posts`);
  }
);
```

```javascript
// Example 2: Error handling
parallel(
  [
    (cb) => readFile('config.json', cb),
    (cb) => connectToDatabase(cb),
    (cb) => validateLicense(cb)
  ],
  (err, [configData, dbConnection, licenseStatus]) => {
    if (err) {
      console.error('Initialization failed:', err);
      process.exit(1);
    }

    // All operations completed successfully
    startApplication(configData, dbConnection, licenseStatus);
  }
);
```

### series()

> **series**: \<`AsyncOperationList`\>(`operations`, `callback`) => `void`

Executes a sequence of asynchronous operations in series

Each operation is executed only if the previous one succeeds.
Operations are executed in sequence but independently (results are not passed between operations).
The callback is invoked with an array containing the results of all operations.

#### Type Parameters

##### AsyncOperationList

`AsyncOperationList` *extends* [`TAsyncOperationList`](../type-aliases/TAsyncOperationList.md)

#### Parameters

##### operations

\[`...AsyncOperationList[]`\]

Array of operations to execute in sequence

##### callback

[`ICallback`](../interfaces/ICallback.md)\<[`MapAsyncOperationReturnTypeToResult`](../type-aliases/MapAsyncOperationReturnTypeToResult.md)\<`AsyncOperationList`\>\>

The final callback to invoke with all results

#### Returns

`void`

#### Example

```javascript
// Example: Execute multiple independent operations in sequence
series(
  [
    (cb) => fetchUserProfile(userId, cb),
    (cb) => fetchUserPermissions(userId, cb),
    (cb) => fetchUserPreferences(userId, cb)
  ],
  (err, results) => {
    if (err) {
      console.error('One of the operations failed:', err);
      return;
    }

    const [profile, permissions, preferences] = results;
    console.log(`User ${profile.name} has ${permissions.length} permissions`);
    applyUserSettings(profile, permissions, preferences);
  }
);
```

### waterfall()

> **waterfall**: \{(`tasks`, `callback`): `void`; \<`R1`\>(`tasks`, `callback`): `void`; \<`R1`, `R2`\>(`tasks`, `callback`): `void`; \<`R1`, `R2`, `R3`\>(`tasks`, `callback`): `void`; \<`R1`, `R2`, `R3`, `R4`\>(`tasks`, `callback`): `void`; \<`R1`, `R2`, `R3`, `R4`, `R5`\>(`tasks`, `callback`): `void`; \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`\>(`tasks`, `callback`): `void`; \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`\>(`tasks`, `callback`): `void`; \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`, `R8`\>(`tasks`, `callback`): `void`; \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`, `R8`, `R9`\>(`tasks`, `callback`): `void`; \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`, `R8`, `R9`, `R10`\>(`tasks`, `callback`): `void`; \}

#### Call Signature

> (`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Parameters

###### tasks

\[\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

##### Parameters

###### tasks

\[(`cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R1`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`, `R2`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

###### R2

`R2`

##### Parameters

###### tasks

\[(`cb`) => `void`, (`arg`, `cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R2`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`, `R2`, `R3`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

###### R2

`R2`

###### R3

`R3`

##### Parameters

###### tasks

\[(`cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R3`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`, `R2`, `R3`, `R4`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

###### R2

`R2`

###### R3

`R3`

###### R4

`R4`

##### Parameters

###### tasks

\[(`cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R4`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`, `R2`, `R3`, `R4`, `R5`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

###### R2

`R2`

###### R3

`R3`

###### R4

`R4`

###### R5

`R5`

##### Parameters

###### tasks

\[(`cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R5`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

###### R2

`R2`

###### R3

`R3`

###### R4

`R4`

###### R5

`R5`

###### R6

`R6`

##### Parameters

###### tasks

\[(`cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R6`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

###### R2

`R2`

###### R3

`R3`

###### R4

`R4`

###### R5

`R5`

###### R6

`R6`

###### R7

`R7`

##### Parameters

###### tasks

\[(`cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R7`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`, `R8`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

###### R2

`R2`

###### R3

`R3`

###### R4

`R4`

###### R5

`R5`

###### R6

`R6`

###### R7

`R7`

###### R8

`R8`

##### Parameters

###### tasks

\[(`cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R8`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`, `R8`, `R9`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

###### R2

`R2`

###### R3

`R3`

###### R4

`R4`

###### R5

`R5`

###### R6

`R6`

###### R7

`R7`

###### R8

`R8`

###### R9

`R9`

##### Parameters

###### tasks

\[(`cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R9`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

#### Call Signature

> \<`R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`, `R8`, `R9`, `R10`\>(`tasks`, `callback`): `void`

Executes an array of functions in sequence, where each function receives the result
of the previous function as its first argument.

The first function receives only a callback, while subsequent functions
receive the result of the previous function and a callback.

##### Type Parameters

###### R1

`R1`

###### R2

`R2`

###### R3

`R3`

###### R4

`R4`

###### R5

`R5`

###### R6

`R6`

###### R7

`R7`

###### R8

`R8`

###### R9

`R9`

###### R10

`R10`

##### Parameters

###### tasks

\[(`cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`, (`arg`, `cb`) => `void`\]

An array of functions to execute in sequence

###### callback

[`ICallback`](../interfaces/ICallback.md)\<`R10`\>

A callback to run after all functions complete or an error occurs

##### Returns

`void`

### withCallback()

> **withCallback**: \<`S`, `T`\>(`setup`, `operation`, `callback`) => `void`

A generic helper function for handling asynchronous operations with callbacks

This function provides a standardized way to:
1. Execute an asynchronous setup operation
2. Check for errors in the setup
3. Check for empty/null results
4. Execute the main operation with the setup result

#### Type Parameters

##### S

`S`

##### T

`T`

#### Parameters

##### setup

(`cb`) => `void`

The setup function that prepares resources needed for the main operation

##### operation

(`resource`, `cb`) => `void`

The main operation to execute with the setup result

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`T`\>

The callback to invoke with the final result

#### Returns

`void`

#### Typeparam

S - The type of data returned by the setup function

#### Typeparam

T - The type of data returned by the main operation

#### Example

```typescript
// Example: Connecting to Redis and executing a command
function getRedisClient(cb: ICallback<RedisClient>) {
  const client = createRedisClient();
  client.connect((err) => {
    if (err) return cb(err);
    cb(null, client);
  });
}

function getUserData(client: RedisClient, cb: ICallback<UserData>) {
  client.get('user:1', (err, data) => {
    if (err) return cb(err);
    if (!data) return cb(new Error('User not found'));
    cb(null, JSON.parse(data));
  });
}

// Using withCallback to compose these operations
withCallback<RedisClient, UserData>(
  getRedisClient,
  getUserData,
  (err, userData) => {
    if (err) {
      console.error('Failed to get user data:', err);
      return;
    }
    console.log('User data:', userData);
  }
);
```

### withCallbackList()

> **withCallbackList**: \<`S`, `T`\>(`setups`, `operation`, `callback`) => `void`

A specialized version of withCallback that handles multiple resources

This function is useful when your operation needs multiple resources that
are prepared by different setup functions.

#### Type Parameters

##### S

`S` *extends* `unknown`[]

##### T

`T`

#### Parameters

##### setups

\{ \[K in string \| number \| symbol\]: (cb: ICallback\<S\[K\<K\>\]\>) =\> void \}

Array of setup functions that prepare resources

##### operation

(`resources`, `cb`) => `void`

The main operation to execute with all setup results

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`T`\>

The callback to invoke with the final result

#### Returns

`void`

#### Typeparam

S - The type of data returned by the setup functions (as a tuple)

#### Typeparam

T - The type of data returned by the main operation

#### Example

```javascript
// Initialize application with multiple resources
withCallbackList(
  [
    // Setup 1: Load configuration
    (cb) => {
      fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) return cb(err);
        try {
          const config = JSON.parse(data);
          cb(null, config);
        } catch (parseErr) {
          cb(new Error(`Invalid config file: ${parseErr.message}`));
        }
      });
    },

    // Setup 2: Connect to database
    (cb) => {
      const db = new Database();
      db.connect((err, connection) => {
        if (err) return cb(err);
        cb(null, connection);
      });
    },

    // Setup 3: Initialize cache
    (cb) => {
      const cache = new Cache();
      cache.initialize((err, client) => {
        if (err) return cb(err);
        cb(null, client);
      });
    }
  ],

  // Main operation using all resources
  ([config, dbConnection, cacheClient], cb) => {
    const app = new Application(config, dbConnection, cacheClient);
    app.start((err, server) => {
      if (err) return cb(err);
      console.log(`Server started on port ${server.port}`);
      cb(null, server);
    });
  },

  // Final callback
  (err, server) => {
    if (err) {
      console.error('Failed to start application:', err);
      process.exit(1);
    }

    // Application successfully started
    console.log(`Application is running with PID ${process.pid}`);
  }
);
```

### withRetry()

> **withRetry**: \<`T`\>(`operation`, `options`, `callback`) => `void`

Creates a wrapped callback with retry logic

If the operation fails, it will be retried up to the specified number of attempts.

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

(`cb`) => `void`

The operation to execute with retry logic

##### options

Retry options

###### maxAttempts?

`number`

Maximum number of attempts (default: 3)

###### retryDelay?

`number`

Delay between retries in milliseconds (default: 1000)

###### shouldRetry?

(`err`) => `boolean`

Function to determine if an error should trigger a retry (default: retry all errors)

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`T`\>

The original callback

#### Returns

`void`

#### Typeparam

T - The type of data returned by the operation

### withTimeout()

> **withTimeout**: \<`T`\>(`callback`, `timeoutMs`) => [`ICallback`](../interfaces/ICallback.md)\<`T`\>

Creates a wrapped callback with timeout handling

If the callback is not called within the specified timeout,
an error is triggered.

#### Type Parameters

##### T

`T`

#### Parameters

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`T`\>

The original callback

##### timeoutMs

`number`

Timeout in milliseconds

#### Returns

[`ICallback`](../interfaces/ICallback.md)\<`T`\>

A wrapped callback with timeout handling

#### Typeparam

T - The type of data returned by the callback
