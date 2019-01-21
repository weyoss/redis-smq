'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 3: Produce and consume 100 messages', function() {

    it('is OK', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const consume = this.sandbox.spy(consumer, 'consume');

        consumer.once('idle', () => {
            expect(consume).to.have.been.calledWith({ hello: 'world' }).callCount(100);
            done();
        });

        function produceNTimes(n, cb) {
            n -= 1;
            if (n >= 0) {
                producer.produce({ hello: 'world' }, (err) => {
                    if (err) cb(err);
                    else produceNTimes(n, cb);
                });
            } else cb();
        }

        produceNTimes(100, (err) => {
            if (err) throw err;
            consumer.run();
        });
    });

});
