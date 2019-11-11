'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 4: Produce a message having messageTTL and sure the message is not consumed and destroyed when messageTTL exceeds', function() {

    it('is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
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
        producer.produceWithTTL({ hello: 'world' }, 3000, (err) => {
            if (err) throw err;
            setTimeout(() => {
                consumer.run();
            }, 5000);
        });
    });

});
