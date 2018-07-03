'use strict';

const heartBeat = require('./heartbeat');


module.exports = (dispatcher, lockKey, tmpLockKey, retryPeriod = 2000) => {
    const instanceId = dispatcher.getInstanceId();
    const queueName = dispatcher.getQueueName();
    const logger = dispatcher.getLogger();

    const states = {
        ACQUIRED: 2,
        ACQUIRING: 3,
        RELEASED: 4,
        RELEASING: 5,
    };

    /**
     *
     * @type {number}
     */
    let state = states.RELEASED;

    /**
     *
     * @type {object|null}
     */
    let redisClient = null;

    /**
     *
     * @type {number|null}
     */
    let timer = null;


    /**
     *
     * @param {string} message
     */
    function debug(message) {
        logger.debug({ lockManager: true, lockKey }, message);
    }

    /**
     *
     * @param {function} cb
     */
    function lockNX(cb) {
        const onGCLock = (err) => {
            if (err) cb(err);
            else if (state === states.ACQUIRING) {
                state = states.ACQUIRED;
                debug('Lock acquired!');
                cb();
            } else cb(new Error('UNEXPECTED_STATE'));
        };
        const onGCTmpLock = (err, success) => {
            if (err) cb(err);
            else if (success) redisClient.set(lockKey, instanceId, onGCLock);
            else acquireLockRetry(cb);
        };
        redisClient.set(tmpLockKey, instanceId, 'NX', 'EX', 60, onGCTmpLock);
    }

    /**
     *
     * @param {function} cb
     */
    function acquireLock(cb) {
        debug('Trying to acquire a lock...');
        const onConsumerOnline = (err, online) => {
            if (err) cb(err);
            else if (online) acquireLockRetry(cb);
            else lockNX(cb);
        };
        const onGCLock = (err, id) => {
            if (err) cb(err);
            else if (id) {
                heartBeat.isOnline(redisClient, queueName, id, onConsumerOnline);
            } else {
                lockNX(cb);
            }
        };
        redisClient.get(lockKey, onGCLock);
    }

    /**
     *
     * @param cb
     */
    function releaseLock(cb) {
        debug('Releasing lock...');
        const success = () => {
            if (state === states.RELEASING) {
                state = states.RELEASED;
                debug('Lock released!');
                cb();
            } else cb(new Error('UNEXPECTED_STATE'));
        };
        const onTmpLockKeyDeleted = (err) => {
            if (err) cb(err);
            else success();
        };
        const onTmpLock = (err, key) => {
            if (err) cb(err);
            else if (key === instanceId) redisClient.del(tmpLockKey, onTmpLockKeyDeleted);
            else success();
        };
        const onLockKeyDeleted = (err) => {
            if (err) cb(err);
            else redisClient.get(tmpLockKey, onTmpLock);
        };
        redisClient.del(lockKey, onLockKeyDeleted);
    }

    /**
     *
     * @param {function} cb
     */
    function acquireLockRetry(cb) {
        if (state === states.ACQUIRING) {
            timer = setTimeout(() => {
                acquireLock(cb);
            }, retryPeriod);
        } else cb(new Error('UNEXPECTED_STATE'));
    }
    
    return {
        /**
         *
         * @param cb
         */
        acquire(cb) {
            if (state === states.ACQUIRED) cb();
            else if (state === states.ACQUIRING) cb(new Error('Acquiring lock operation is pending'));
            else if (state === states.RELEASING) cb(new Error('Releasing lock operation is pending'));
            else {
                state = states.ACQUIRING;
                acquireLock(cb);
            }
        },

        /**
         *
         * @param cb
         */
        release(cb) {
            if (state === states.RELEASED) cb();
            else if (state === states.RELEASING) cb(new Error('Releasing lock is pending'));
            else {
                state = states.RELEASING;
                if (timer) clearTimeout(timer);
                if (state === states.ACQUIRED) releaseLock(cb);
                else cb();
            }
        },

        /**
         *
         * @param client
         */
        setRedisClient(client) {
            redisClient = client;
        },
    };
};
