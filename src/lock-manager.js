'use strict';

const Redlock = require('redlock');
const redisClient = require('./redis-client');

/**
 * @param {object} redisClientInstance
 * @return {object}
 */
function LockManager(redisClientInstance) {
    let redlock = new Redlock([redisClientInstance]);
    let acquiredLock = null;
    let timer = 0;

    function setAcquiredLock(lock, extended, cb) {
        if (redlock) {
            acquiredLock = lock;
            cb(null, extended);
        } else cb(new Error('Instance no longer usable after calling quit()'));
    }

    function acquireLock(lockKey, ttl, cb) {
        const retry = (err) => {
            if (err && err.name !== 'LockError') cb(err);
            else {
                acquiredLock = null;
                timer = setTimeout(() => {
                    acquireLock(lockKey, ttl, cb);
                }, 1000);
            }
        };
        if (acquiredLock) {
            acquiredLock.extend(ttl, (err, lock) => {
                if (err) retry(err);
                else setAcquiredLock(lock, true, cb);
            });
        } else {
            if (!redlock) cb(new Error('Instance is no longer usable after calling quit(). Create a new instance.'));
            else {
                redlock.lock(lockKey, ttl, (err, lock) => {
                    if (err) retry(err);
                    else setAcquiredLock(lock, false, cb);
                });
            }
        }
    }

    function releaseLock(cb) {
        clearTimeout(timer);
        if (!acquiredLock) cb();
        else {
            acquiredLock.unlock((err) => {
                if (err && err.name !== 'LockError') cb(err);
                else {
                    acquiredLock = null;
                    cb();
                }
            });
        }
    }

    function quit(cb) {
        if (!redlock) cb();
        else {
            releaseLock((err) => {
                if (err) cb(err);
                else {
                    redlock.quit(() => {
                        redlock = null;
                        cb();
                    });
                }
            });
        }
    }

    return {
        isLocked() {
            return acquiredLock !== null;
        },
        acquireLock,
        releaseLock,
        quit
    };
}

LockManager.getInstance = (config, cb) => {
    redisClient.getNewInstance(config, (c) => {
        const instance = LockManager(c);
        cb(instance);
    });
};

module.exports = LockManager;
