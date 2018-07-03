'use strict';

const config = require('./config');
const { Producer, Message } = require('redis-smq');

const producer = new Producer('test_queue', config);

function produceNTimes(payload, n, cb) {
    n -= 1;
    if (n >= 0) {
        const message = new Message();
        message.setBody(payload);
        producer.produceMessage(message, (err) => {
            if (err) cb(err);
            else produceNTimes(payload, n, cb);
        });
    } else cb();
}

produceNTimes({ hello: 'world' }, 1000000, (err) => {
    if (err) throw err;
    else {
        console.log('Produced successfully!');
        producer.shutdown();
    }
});

