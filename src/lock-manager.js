'use strict';

const Redlock = require('redlock');
const redisClient = require('./redis-client');

function lockManager(redisClientInstance) {
    const states = {
        UP: 1,
        DOWN: 0,
    };
    let redlock = new Redlock([redisClientInstance]);
    let acquiredLock = null;
    let timer = 0;
    let state = states.UP;

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
        if (state === states.UP) {
            if (acquiredLock) {
                acquiredLock.extend(ttl, (err, lock) => {
                    if (err) retry(err);
                    else {
                        acquiredLock = lock;
                        cb();
                    }
                });
            } else {
                redlock.lock(lockKey, ttl, (err, lock) => {
                    if (err) retry(err);
                    else {
                        acquiredLock = lock;
                        cb();
                    }
                });
            }
        } else cb(new Error('Lock manager is down.'));
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
        state = states.DOWN;
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
            return (acquiredLock !== null);
        },
        acquireLock,
        releaseLock,
        quit,
    };
}

lockManager.getInstance = (config, cb) => {
    redisClient.getNewInstance(config, (c) => {
        const instance = lockManager(c);
        cb(instance);
    });
};

module.exports = lockManager;
