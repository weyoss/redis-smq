# CHANGELOG

## 7.0.7 (2022-08-10)

* Bump up redis-smq-common to v1.0.2 (ff385ad)
* Update docs (3871e8f)

## 7.0.6 (2022-08-08)

* Improve consumer/producer shutdown handling (36278ce)
* Update docs (51dfd16)
* Update examples (208934b)
* Fix tests (573e340)
* Add and use ProducerNotRunningError error class (e89facd)
* Fix a potential MaxListenersExceededWarning exception throwing (011a21b)
* Make producers to be run manually before producing messages (c989449)

## 7.0.5 (2022-07-20)

* Remove code redundancies (55eec79)
* Update event listeners docs (e308848)
* Refactor IEventListener interface, clean up (14dbf30)

## 7.0.4 (2022-07-14)

* Fix dev dependencies (e42d072)
* Update installation info (12c6170)
* Make redis-smq-common as a peer dependency (ade08af)

## 7.0.3 (2022-07-13)

* Fix consuming-messages/test00012 (4c9dfb8)

## 7.0.2 (2022-07-13)

* Bump up redis-smq-common to v1.0.1 (e3fbb10)
* Bump up typescript to v4.7.4 (0f69254)
* Fix npm vulnerability warnings (9925be0)
* Clean up examples (72ea0fb)

## 7.0.1 (2022-06-18)

* Update migrating.md (9065d5f)
* Update README.md (4cfb653)

## 7.0.0 (2022-06-18)

* Fix typing issue (cd8bf6a)
* Bump up redis-smq-common to v1.0.0 (02c353d)
* Update callback vs promise vs async/await benchmarks (6fca49c)
* Update README.md (7fbdcbf)

## 7.0.0-rc.8 (2022-06-09)

* Update docs (96a45e7)
* Test consumers/producers event listeners (856e12d)
* Implement consumers/producers event listeners (6f5d603)

## 7.0.0-rc.7 (2022-06-07)

* Update redis keys prefix (a6ca852)
* Use codecov instead of coveralls (d8b5f83)
* Improve consuming-messages/test00013 (5cd823c)
* Improve consuming-messages/test00010 (a9a4f47)
* Test WatchdogWorker (73fbe9a)
* Clean up (aa9a51a)
* Improve unacknowleged messages handling, refactor (005c6a0)
* Fix outdated javascript examples (e31f89c)
* Keep a clean directory structure (642739f)
* Update README.md (5c011e3)
* Clean up tests (10ebb77)

## 7.0.0-rc.6 (2022-05-31)

* Bump up redis-smq-common to v1.0.0-rc.11 (43717f0)

## 7.0.0-rc.5 (2022-05-31)

* Bump up redis-smq-common to v1.0.0-rc.10 (e025525)
* Update docs (738d9d0)

## 7.0.0-rc.4 (2022-05-30)

* Update README.md (fef27c1)
* Support node-redis v4 (c7a91b1)
* Drop support for node.js v12 (0b5a4e9)
* Fix outdated documentation (d3bf31b)
* Fix broken link (fd48c86)

## 7.0.0-rc.3 (2022-05-26)

* Update migration/configuration/message/message-manager references (6d53877)
* Update docs (df2eddb)
* Bump up redis-smq-common to v1.0.0-rc.3, refactor (0508c75)
* Bump up redis-smq-common to v1.0.0-rc.2 (f38d757)
* Remove singletons, use instance based configuration (65f28ec)
* Fix 'fsevents not accessible from jest-haste-map' error (1cbc786)
* Use shared components from redis-smq-common (2abfb98)
* Reorganize codebase folders (cdf25fa)
* Clean up redis-keys.ts (c6b8af8)
* Add PluginRegistrationNotAllowedError error, clean up (aa003a1)
* Update tests (0950706)
* Implement a plugging system for using the web-ui as an extension (e2b0cca)
* Fix tests (ca01d66)
* Reorganize codebase files (2cef191)
* Remove the web ui from codebase, clean up (ffe03c9)
* Update http-api.md (4023dc5)

## 7.0.0-rc.2 (2022-05-18)

* Fix typo (8002616)
* Update docs (d40b1c2)
* Update misc scripts (bde5171)
* Clean up WebsocketRateStreamWorker, use incremental timestamp (918fac0)

## 7.0.0-rc.1 (2022-05-15)

* Update docs (41ee4bf)
* Fix consuming-messages/test00015 test (8b3072a)
* Clean up and simplify the consumer.consume() callback argument (bd98b65)
* Update docs (9ede0f6)
* Update tests (b1772aa)
* Refactor configuration object (2ebe1ba)
* Make QueueManager constructor private (c55cdad)
* Update redisKeys version (add3e8d)
* Update scheduling-messages.md (4b2bb2d)
* Update multiplexing.md (f36f712)

## 7.0.0-rc.0 (2022-05-13)

* Update LICENSE (2ef31db)
* Update multiplexing.md (62c575e)
* Add v7 migration guide (48e325e)
* Add error codes for message publishing/scheduling failures (e89308d)
* Update examples (564ffe6)
* Update docs (e8d80c2)
* Bump up redis-smq-monitor to v7.0.0-rc.0 (059e0fd)
* Update docs (5810361)
* Fix http-api/test00001 test (a2f257c)
* Update docs (117955a)
* Update tests (ba83f0b)
* Improve QueueManager methods naming (b1c5237)
* Clean up (f57f237)
* Fix pending messages related data in websocket streams (bbd99cb)
* Clean up (5ae08f8)
* Update examples (e3990a9)
* Update tests (86d58e4)
* Unify pending messages API for both LIFO and Priority messages (ffdbfd1)
* Fix tests (f00ea26)
* Fix queue creation, handle properly queue settings (ec00907)
* Clean up Queue class (afce21f)
* Update tests (3bc9fd4)
* Clean up QueueManager (852633d)
* Validate the message queue before scheduling a message (9c70c0c)
* Refactor MessageManager API, clean up (0df67f3)
* Fix various tests errors due to incompatible APIs (bea78a6)
* Refactor Producer/Consumer/QueueManager APIs (3f0574a)
* Refactor consumer class, update consumer.consume() signature (618172c)
* Expect the number messages to be at greater than 6 (02ea402)
* Improve consuming-messages/test00031 (3605512)
* Clean up (3660ba3)
* Bump up redis-smq-monitor to v6.5.7 (05d004a)
* Fix consuming-messages/test00014 (8a1b7b9)
* Merge branch 'lock-manager' (c1edcb2)
* Throw an error when a lock could not be acquired or extended (5ff1fca)
* Refactor LockManager to allow auto extending locks (efbbe35)

## 6.4.2 (2022-04-23)

* Test expired locks (367660e)
* Do not throw an exception and try to acquire again an expired lock (b7f7d36)
* Bump up redis-smq-monitor to v6.5.6 (c31cd2e)
* Fix NPM security vulnerabilities (3900ddf)
* Clean up monitor-server services (954d856)

## 6.4.1 (2022-03-22)

* Fix fsevents not accessible from jest-haste-map (482cb11)
* Fix broken url in the Web UI docs (02e08d7)

## 6.4.0 (2022-03-22)

* Update Web UI docs (ed63186)
* Bump up redis-smq-monitor to v6.5.5 (3179f85)
* Test monitor.basePath configuration (00c680d)
* Support basePath when running web ui from behind a reverse proxy (ea17ffe)

## 6.3.1 (2022-03-15)

* Fix typos (a5db76a)

## 6.3.0 (2022-03-15)

* Update docs (3ad938a)
* Use colons instead of dots for joining Redis key segments (75dbcb6)
* Continue testing consumer message multiplexing (17c9659)
* Improve multiplexing delay when dequeuing messages (a635c8a)
* Remove deprecated consumer.cancel(queue,priority,cb), add new tests (4a2d458)
* Fix test errors, clean up (09feb9c)
* Prefer method definition over arrow function property (5d7e664)
* Implement MultiplexedMessageHandlerRunner (6980cbf)
* Refactor MessageHandler to allow more modular structures (b079244)

## 6.2.6 (2022-03-04)

* Clean up (2837cc6)
* Implement MessageHandlerRunner (cfba094)

## 6.2.5 (2022-03-03)

* Update Consumer API docs (8580f4a)
* Do not consume messages with and without priority from the same queue (84130bf)
* Use default parameters when creating a Ticker instance (db9feb0)
* Update consumer queue list upon shutting down a message handler (14519e2)

## 6.2.4 (2022-02-23)

* Fix consuming-messages/test00015 error (c5c365a)

## 6.2.3 (2022-02-23)

* Bump up redis-smq-monitor to v6.5.3 (4e845d0)
* Remove gracefully a message handler (a4402b7)
* Add MessageHandlerAlreadyExistsError custom error (65882ed)

## 6.2.2 (2022-02-21)

* Fix a queue rate limiting bug allowing to save invalid Redis keys (1dc91aa)
* Bump up redis-smq-monitor to v6.5.2 (e192db0)
* Update docs (5a6469e)

## 6.2.1 (2022-02-19)

* Remove unused code (475fa3d)

## 6.2.0 (2022-02-19)

* Bump up redis-smq-monitor to v6.5.1 (c543c55)
* Improve consumer message rate time series handling (7d51bb3)
* Update docs (ef21b39)
* Allow configuring queue rate limiting from the HTTP API (ec2bc52)
* Test message consumption rate limiting (62e5b1f)
* Implement message consumption rate limiting (1c87ec0)

## 6.1.0 (2022-02-14)

* Allow configuring which messages to store with extended parameters (7bd37a1)

## 6.0.4 (2022-02-13)

* Fix missing type definition for koa-bodyparser (4b8a11e)

## 6.0.3 (2022-02-13)

* Increase code coverage (ec839a1)

## 6.0.2 (2022-02-12)

* Update architecture overview diagram (e8f77a8)
* Improve offline consumers handling & message recovery strategy (4072939)
* Fix typos and update README.md (b73bd37)

## 6.0.1 (2022-02-11)

* Update docs (78fef2e)
* Clean up WorkerPool class (b4dae38)

## 6.0.0 (2022-02-08)

* Bump up redis-smq-monitor version to 6.4.0 (71ceb45)
* Implement TimeSeriesWorker (a5c404e)
* When deleting a namespace throw an error if it does not exist (28d0be0)
* Fix schedule-message.lua parameters (15708c4)
* Allow managing namespaces, update HTTP API, test (b0c265c)
* Rename setScheduledPeriod() to setScheduledRepeatPeriod() (d6e3376)
* Improve Redis keys handling (d9c50f3)
* Improve LUA scripts parameters handling (5aaa893)
* Remove redundant call to this.getMainKeys() (f3b1f1f)
* Update docs (31c81ca)

## 6.0.0-rc.11 (2022-02-02)

* Fix tests/purging-queues/test00007 (88e1d3a)
* Update pre-push hook (8594e6a)
* Clean up (63ca899)
* Fix broken pre-release v6.0.0-rc.10 due to missing dependency (9739115)

## 6.0.0-rc.10 (2022-02-01)

* Improve locking mechanisms, remove redlock package, refactor (8f5d9b2)
* Continue Message class refactoring, update docs and examples (d25f370)
* Fix consuming-messages/test00006 test errors, refactor Message class (efa1163)
* Fix at-most-once message delivery (eb4e6fa)
* Update tests (6f9d07e)
* Bump up redis-smq-monitor to v6.3.0 (ec518fc)
* Update time series data only when message rate > 0 (748bc7f)
* Remove dependency on async package and clean up (76698b2)
* Use worker pool for system workers and monitor-server workers (8bee7ec)
* Test producing duplicate messages (a260fd7)
* Remove redundant code related to message.isSchedulable() (34f25cc)
* Update Redis keys prefix (0914c99)
* Forbid producing a message more than once, introduce MessageMetadata (eebab36)

## 6.0.0-rc.9 (2022-01-27)

* Check object reference equality before clearing singleton instance (88e35ad)
* Improve namespaced  logger (9acf9e9)
* Support external loggers, use system-wide config, refactor codebase (eaf9c14)
* Make storing acknowledged & dead-lettered messages optional (96b8be3)
* Fix typos and update readme (21b2e9a)

## 6.0.0-rc.8 (2022-01-24)

* Update migration guide (545932a)
* Test multi-queue consumer, update docs (70209a0)
* Fix ticker waitlock issue (fca5bd1)
* Handle gracefully run/shutdown call errors, fix test errors, clean up (779c562)
* Clean up (4dc6ce5)
* Update examples (38064d0)
* Implement multi-queue consumers, refactor and clean up (9c2fefb)
* Fix typo in README.md (e0ca944)

## 6.0.0-rc.7 (2022-01-21)

* Update package.json keywords (e84d4cf)
* Remove extra spacing in message-manager.md (b87ac3d)
* Update QueueManager API reference (832b090)
* Move purge operations to handlers (5345dc3)
* Rename and move purgePendingMessagesWithPriority to MessageManager (e959d7b)
* Rename and move purgePendingMessages to MessageManager (3804122)
* Rename and move purgeScheduledMessages to MessageManager (78ba9ac)
* Rename and move purgeAcknowledgedMessages to MessageManager (febcd9c)
* Rename and move purgeDeadLetteredMessages to MessageManager (cf07797)
* Update message-manager.md (8b5fec1)
* Rename requeueMessageFromDLQueue to requeueDeadLetteredMessage (2d4df08)
* Rename requeueMessageFromAcknowledgedQueue to requeueAcknowledgedMessage (59f446e)
* Rename deleteDeadLetterMessage to deleteDeadLetteredMessage (f99dd09)
* Rename getDeadLetterMessages to getDeadLetteredMessages (3172c20)
* Update migration guide (837da04)

## 6.0.0-rc.6 (2022-01-20)

* Bump up redis-smq-monitor to v6.1.0 (83107be)
* Update README.md (0ce39bd)
* Make Producer stateless, drop MultiQueueProducer, refactor, clean up (7597762)

## 6.0.0-rc.5 (2022-01-18)

* Fix a possible EventEmitter memory leak in WorkerRunner (4d3a066)
* Fix MultiQueueProducer bug with queueName not being validated, test (c4cbc7d)

## 6.0.0-rc.4 (2022-01-18)

* Bump redis-smq-monitor to v6.1.0 (930aa95)
* Improve error message (443794b)
* Make MultiQueueProducer publish a message as a single atomic operation (19cfb2f)
* Always invoke setUpMessageQueue() when publishing a message (502a4cb)
* Test scheduled messages publication when dst queue is deleted (41055f9)
* Make sure scheduled messages aren't published if dst queue is deleted (cda411a)
* Fix a typo (af5c310)
* Fix delete queue validation bug causing request to hang forever (c14488a)
* Update typescript/javascript examples (f595bb1)
* Update queue-manager.md (461ae0b)
* Update HTTP API endpoints documentation (5da7777)
* Improve HTTP API error handling (c90473a)
* Allow to delete a message queue from HTTP API, test, update docs (a3087a2)
* Fix husky v7 setup (3fa4f2f)
* Update HTTP API reference (688a028)
* Fix npm vulnerability warnings (7ad221b)
* Refactor monitor server HTTP API routing (2fec7c3)

## 6.0.0-rc.3 (2022-01-14)

* Allow to delete a message queue alongside with its related data.
* Make sure to release queue lock before returning.
* Improve QueueManager API method names, update docs.
* Update QueueManager API reference (add deleteQueue() method).
* Fix QueueManager broken method references in the Web UI.
* Rename purgeScheduledMessages() to purgeScheduledQueue().
* Test deleting queues, wait for a heartbeat before returning during startup.
* Update QueueManager API reference.
* Fix random errors from tests/consuming-messages/test00003.
* Fix random test errors due to javascript time drift.
* Do not return an error if a heartbeat is not found. Just skip it.

## 6.0.0-rc.2 (2022-01-11)

* Optimize npm package size, update docs.
* Rename event MESSAGE_DEQUEUED to MESSAGE_RECEIVED.
* Update ConsumerMessageRateWriter constructor signature
* Increase code coverage.
* Small cleanup and improvements. 

## 6.0.0-rc.1 (2022-01-04)

* Expire consumers and producers time series after 30s of inactivity.
* Improve redisKeys versioning strategy, update docs.
* Improve migration guide.

## 6.0.0-rc.0 (2022-01-03)

* Implement MultiQueueProducer for publishing messages to multiple queues using a single producer instance.
* Implement rates time series for queues, producers and consumers, allowing to move the chart to the left or the right
in order to scan the timeline.
* Refactor MessageManager and QueueManager API
* Add new WebSocket streams for heartbeats, rates, queues, consumers, and producers.
* Refactored Web UI.
* Overall improvements and minor bug fixes.

## 5.0.11 (2021-12-07)

* Bumped redis-smq-monitor to v5.0.7.
* Updated package.json to use strict package versioning.

## 5.0.10 (2021-12-04)

* Bumped redis-smq-monitor to v5.0.6.
* Updated scheduler.md.

## 5.0.9 (2021-12-03)

* Calculate and emit "idle" event only when testing.

## 5.0.8 (2021-12-01)

* Updated architecture diagram.
* Bumped redis-smq-monitor to v5.0.4

## 5.0.7 (2021-11-27)

* Do not throw an error immediately and allow a compatible Redis client (ioredis, node_redis) to reconnect in case of 
Redis server not responding or restarting.

## 5.0.6 (2021-11-26)

* Reviewed and updated documentation files.

## 5.0.5 (2021-11-25)

* Minor improvements: refactored and cleaned up MessageRate and QueueManager classes.

## 5.0.4 (2021-11-24)

* Updated RedisSMQ logo.
* Bumped redis-smq-monitor to v5.0.3.

## 5.0.3 (2021-11-23)

* Updated RedisSMQ logo.

## 5.0.2 (2021-11-23)

* Added RedisSMQ logo.
* Bumped redis-smq-monitor to v5.0.2.
* Bumped type-coverage to v2.19.0.

## 5.0.1 (2021-11-22)

* Fixed broken redis-smq-monitor package.

## 5.0.0 (2021-11-22)

* Implemented message and queue management features in the Web UI.
* Refactored the MQ to use LIFO queues.
* Updated HTTP API endpoints.
* Minor overall improvements and changes.

## 4.0.9 (2021-11-10)

* Fixed outdated Message API docs.

## 4.0.8 (2021-11-09)

* Improved debugging info.
* Allowed listing message queues from QueueManagerFrontend.

## 4.0.7 (2021-11-08)

* Made queue namespace optional for queue/message management. When not provided, the configuration namespace is used. If 
the configuration namespace is not set, the default namespace is used.

## 4.0.6 (2021-11-07)

* Fixed queues and messages management issues when using many namespaces.

## 4.0.5 (2021-11-05)

* Fixed outdated examples in the HTTP API reference

## 4.0.3 (2021-11-04)

* Minor refactoring and improvements.

## 4.0.2 (2021-11-03)

* Updated docs.
* Added current MQ architecture overview.

## 4.0.1 (2021-11-02)

* Removed Scheduler class in favor of MessageManager.
* Added QueueManager and MessageManager, allowing to fetch/delete/requeue messages from different queues.
* Improved MQ performance by using background message processing with the help of workers.
* MQ architecture tweaks and improvements.
* Redis keys namespace bug fix.

## 3.3.0 (2021-10-07)

- With the release of v3.3.0, reliable, persistent priority queues are now supported.
- Added new tests and increased code coverage.

## 3.2.0 (2021-10-01)

- Run tests in Node.js v12, v14, and v16
- Run tests in Redis v2.6.17, v3, v4, v5, and v6
- Made redis-smq-monitor server an integral part of redis-smq
- Implemented Scheduler HTTP API endpoints
- Various fixes and improvements

## 3.1.1 (2021-09-16)

* Added Github CI

## 3.1.0 (2021-09-15)

* Added Scheduler API docs.
* Added new methods to fetch and delete scheduled messages.

## 3.0.4 (2021-09-08)

* Updated examples.

## 3.0.3 (2021-09-08)

* Fixed .npmignore.

## 3.0.2 (2021-09-08)

* Moved all dependant declaration packages from "devDependencies" to "dependencies".

## 3.0.1 (2021-09-08)

* Moved husky to devDependencies.

## 3.0.0 (2021-09-08)

* A major release v3 is out.
* Starting from this release, only active LTS and maintenance LTS Node.js releases are supported. 
* Upgrading your installation to the newest version should be straightforward as most APIs are compatible with some exceptions.
* Project codebase has been migrated to TypeScript to make use of strong typings. 
* JavaScript's users are always first class citizens.
* Fixed a compatibility issue between ioredis and redis when calling multi.exec().
* Fixed typing inconsistencies (ConfigRedisDriver and RedisDriver types) between redis-smq and redis-smq-monitor.
* Improved scheduler mechanics, refactored GC, and updated tests.
* Introduced RedisClient.
* Updated docs.

## 2.0.12 (2021-02-07)

* Fixed a bug in redis-client.js.

## 2.0.11 (2020-10-20)

* Improved overall performance by using asynchronous loops and avoiding recursion.
* Continued clean up and refactoring.
* Added tests coverage.

## 2.0.10 (2020-10-16)

* Implemented stats providers.
* Fixed a potential memory leak issue relative to event listeners.
* Created a new module for encapsulating message collecting logic. 
* Improved code structure

## 2.0.9 (2020-10-11)

* Updated tests.

## 2.0.8 (2020-10-11)

* Refactored legacy code, upgraded eslint and added prettier.

## 2.0.7 (2020-10-04)

* Fixed bug in stats aggregation causing lost of queue name and queue namespace.

## 2.0.6 (2020-10-02)

* Refactored gc.collectProcessingQueuesMessages()
* Capitalized factory names

## 2.0.5 (2020-09-23)

* Bumped redis-smq-monitor to 1.1.5

## 2.0.4 (2020-09-23)

* Bumped redis-smq-monitor to 1.1.4

## 2.0.3 (2020-09-21)

* Bumped redis-smq-monitor to 1.1.3

## 2.0.2 (2020-09-20)

* Bumped redis-smq-monitor to 1.1.2

## 2.0.1 (2020-09-20)

* Included CPU usage percentage, hostname, and IP address in the consumer stats
* Bumped redis-smq-monitor to 1.1.1
* Updated the monitor parameters types based on the redis-smq-monitor package typing

## 2.0.0 (2020-04-12)

* Removed all deprecated methods
* Removed undocumented Message constructor parameters 
* Message.createFromMessage() now accepts 2 parameters for cloning a message (see Message API docs)
* Introduced TypeScript support
* Added examples for TypeScript
* Small refactoring and cleaning

## 1.1.6 (2019-11-29)

* Bug fix: Fixed broken message retry delay (see issue #24)

## 1.1.5 (2019-11-26)

* Migrated from Mocha/sinon/chai to Jest
* Minor scheduler bug fix in some cases when using both `PROPERTY_SCHEDULED_REPEAT` and `PROPERTY_SCHEDULED_CRON`
* Code cleanup

## 1.1.4 (2019-11-23)

* Hotfix release addresses a bug with invalid state checking at the dispatcher level

## 1.1.3 (2019-11-23)

* Clean up
* Improved error handling
* Improved dispatcher state management
* Fixed broken redis parameters parsing for old configuration syntax used before v1.1.0

## 1.1.1 (2019-11-12)

* Handle gracefully unexpected errors for both consumers/producers. Instead of terminating the whole node process, in case of an unexpected error, just log the error and shutdown the instance.
* Fixed wrong emitted event during producer instance bootstrap causing TypeError. 

## 1.1.0 (2019-11-11)

* Major code refactoring and improvements
* Fixed namespace related bugs
* Fixed minor consumer related bugs
* Added support for ioredis
* Rewritten RedisSMQ Monitor based on React and D3
* RedisSMQ Monitor has split up from main repository and now maintained separately. 
* Introduced changelog

