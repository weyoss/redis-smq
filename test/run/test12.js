'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const Message = require('../../index').Message;

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 12: Produce and consume a delayed message', function() {

    it('is OK', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer();
        let createdAt = null;
        let consumedAt = null;
        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            consumedAt = Date.now();
            cb();

            const diff = Math.floor((consumedAt - createdAt) / 1000);
            expect(diff === 10).to.be.true;
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
