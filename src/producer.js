'use strict';

const Instance = require('./instance');
const Message = require('./message');
const redisKeys = require('./redis-keys');
const events = require('./events');
const ProducerStatsProvider = require('./producer-stats-provider');

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
        this.on(events.DOWN, () => {
            this.statsProvider = null;
        });
    }

    /**
     * @protected
     * @return {object}
     */
    getRedisKeys() {
        return redisKeys.getProducerKeys(this.getId(), this.getQueueName());
    }

    /**
     * @protected
     */
    getStatsProvider() {
        if (!this.statsProvider) {
            this.statsProvider = ProducerStatsProvider(this);
        }
        return this.statsProvider;
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
                        if (this.statsProvider) this.statsProvider.incrementInputSlot();
                        cb();
                    }
                });
            }
        };
        if (!this.powerStateManager.isUp()) {
            if (this.isBootstrapping() || this.powerStateManager.isGoingUp()) this.once(events.UP, proceed);
            else this.error(new Error(`Producer ID ${this.getId()} is not running`));
        } else proceed();
    }
}

module.exports = Producer;
