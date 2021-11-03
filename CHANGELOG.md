# CHANGELOG

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

