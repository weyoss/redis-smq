# CHANGELOG

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

