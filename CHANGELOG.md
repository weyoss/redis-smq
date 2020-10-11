# CHANGELOG

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

