'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 5: Construct a consumer with messageTTL parameter and make sure it does not consume a message which has been in the queue longer than messageTTL', function() {

    it('is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer('test_queue');
        const consumer = this.sandbox.getConsumer('test_queue', { messageTTL: 2000 });
        const consume = this.sandbox.spy(consumer, 'consume');

        let messageDestroyed = 0;
        consumer.on('message.destroyed', () => {
            messageDestroyed += 1;
        });
        consumer.once('idle', () => {
            expect(consume).to.have.been.callCount(0);
            expect(messageDestroyed).to.eq(1);
            done();
        });
        producer.produce({ hello: 'world' }, (err) => {
            if (err) throw err;
            setTimeout(() => {
                consumer.run();
            }, 5000);
        });
    });

});
