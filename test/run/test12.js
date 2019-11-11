'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const Message = require('../../index').Message;

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 12: Produce and consume a delayed message', function() {

    it('is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const validateTime = this.sandbox.validateTime;

        let createdAt = null;
        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            cb();

            const diff = Date.now() - createdAt;
            expect(validateTime(diff, 10000)).to.be.true;
            done();
        });
        consumer.run();

        const msg = new Message();
        msg.setScheduledDelay(10).setBody({ hello: 'world' }); // seconds
        createdAt = msg.getCreatedAt();
        producer.produceMessage(msg, (err) => {
            if (err) throw err;
        });
    });

});
