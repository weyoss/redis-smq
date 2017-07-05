'use strict';

const redisKeys = require('./redis-keys');

module.exports = {

    /**
     *
     * @param {object} client
     * @param {function} cb
     */
    getQueues(client, cb) {
        const keys = redisKeys.getKeys();
        client.scan('0', 'match', keys.patternQueueName, 'count', 1000, (err, res) => {
            if (err) cb(err);
            else {
                const [cur, queues] = res;
                cb(null, queues);
            }
        });
    },

    /**
     *
     * @param {object} client
     * @param {function} cb
     */
    getDeadLetterQueues(client, cb) {
        const keys = redisKeys.getKeys();
        client.scan('0', 'match', keys.patternQueueNameDead, 'count', 1000, (err, res) => {
            if (err) cb(err);
            else {
                const [cur, queues] = res;
                cb(null, queues);
            }
        });
    },

    /**
     *
     * @param {object} client
     * @param {Array} queues
     * @param {function} cb
     */
    calculateQueueSize(client, queues, cb) {
        const queuesList = [];
        if (queues && queues.length) {
            const multi = client.multi();
            for (const queueName of queues) multi.llen(queueName);
            multi.exec((err, res) => {
                if (err) cb(err);
                else {
                    res.forEach((size, index) => {
                        const segments = redisKeys.getKeySegments(queues[index]);
                        queuesList.push({
                            name: segments.queueName,
                            size,
                        });
                    });
                    cb(null, queuesList);
                }
            });
        } else cb(null, queuesList);
    },

};
