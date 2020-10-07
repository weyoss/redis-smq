'use strict';

const Instance = require('./instance');
const Message = require('./message');
const redisKeys = require('./redis-keys');
const events = require('./events');

class Producer extends Instance {
    /**
     * See docs.
     *
     * @param {string} queueName
     * @param {object} config
     */
    constructor(queueName, config = {}) {
        super(config);
        if (!queueName) {
            throw new Error('[queueName] parameter is required.');
        }
        this.setQueueName(queueName);
        this.run();
    }

    /**
     * @protected
     */
    registerEventsHandlers() {
        super.registerEventsHandlers();
        this.on(events.STATS_UP, () => this.statsInstance.producerStats());
    }

    /**
     * @protected
     * @return {object}
     */
    getRedisKeys() {
        return redisKeys.getProducerKeys(this.getId(), this.getQueueName());
    }

    /**
     *
     * @param {*|Message}msg
     * @param {function} cb
     */
    produceMessage(msg, cb) {
        if (!(msg instanceof Message)) {
            const m = new Message();
            m.setBody(msg);
            msg = m;
        }
        const onProduced = () => {
            this.emit(events.MESSAGE_PRODUCED, msg);
            cb();
        };
        const proceed = () => {
            if (this.schedulerInstance.isScheduled(msg)) this.schedulerInstance.schedule(msg, null, onProduced);
            else {
                const { keyQueueName } = this.getInstanceRedisKeys();
                this.redisClientInstance.lpush(keyQueueName, msg.toString(), (err) => {
                    if (err) cb(err);
                    else {
                        if (this.statsInstance) this.statsInstance.incrementInputSlot();
                        cb();
                    }
                });
            }
        };
        if (!this.isUp()) {
            if (this.isBootstrapping() || this.isGoingUp()) this.once(events.UP, proceed);
            else this.error(new Error(`Producer ID ${this.getId()} is not running`));
        } else proceed();
    }
}

module.exports = Producer;
