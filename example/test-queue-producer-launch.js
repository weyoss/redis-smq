'use strict';

const config = require('./config');
const Producer = require('redis-smq').Producer;

/**
 *
 * @param producer
 * @param message
 * @param n
 * @param cb
 */
function produceNTimes(producer, message, n, cb) {
    n -= 1;
    if (n >= 0) {
        message.sequenceId = n;
        producer.produce(message, (err) => {
            if (err) cb(err);
            else produceNTimes(producer, message, n, cb);
        });
    } else cb();
}

const producer = new Producer('test_queue', config);
produceNTimes(producer, { hello: 'world' }, 1000000, (err) => {
    if (err) throw err;
    else {
        console.log('Produced successfully!');
        producer.shutdown();
    }
});

