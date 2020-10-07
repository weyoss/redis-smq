'use strict';

const Instance = require('./instance');
const redisKeys = require('./redis-keys');
const HeartBeat = require('./heartbeat');
const GarbageCollector = require('./gc');
const Message = require('./message');
const events = require('./events');
const util = require('./util');


class Consumer extends Instance {
    /**
     * See docs.
     *
     * @param {object} config
     * @param {object} options
     */
    constructor(config = {}, options = {}) {
        super(config);
        if (!this.constructor.hasOwnProperty('queueName')) {
            throw new Error('Undefined queue name!');
        }
        this.setQueueName(this.constructor.queueName);
        this.options = options;
        this.consumerMessageTTL = options.hasOwnProperty('messageTTL') ? Number(options.messageTTL) : 0;
        this.consumerMessageConsumeTimeout = options.hasOwnProperty('messageConsumeTimeout')
            ? Number(options.messageConsumeTimeout) : 0;
        this.messageRetryThreshold = options.hasOwnProperty('messageRetryThreshold')
            ? Number(options.messageRetryThreshold) : 3;
        this.messageRetryDelay = options.hasOwnProperty('messageRetryDelay')
            ? Number(options.messageRetryDelay) : 0;
    }

    getConsumerMessageConsumeTimeout() {
        return this.consumerMessageConsumeTimeout;
    }

    getMessageRetryThreshold() {
        return this.messageRetryThreshold;
    }

    getConsumerMessageTTL() {
        return this.consumerMessageTTL;
    }

    getMessageRetryDelay() {
        return this.messageRetryDelay;
    }

    getRedisKeys() {
        if (!this.redisKeys) {
            this.redisKeys = redisKeys.getConsumerKeys(this.getId(), this.getQueueName());
        }
        return this.redisKeys;
    }

    getNextMessage() {
        this.loggerInstance.info('Waiting for new messages...');
        const { keyQueueName, keyQueueNameProcessing } = this.getInstanceRedisKeys();
        this.redisClientInstance.brpoplpush(keyQueueName, keyQueueNameProcessing, 0, (err, json) => {
            if (err) this.error(err);
            else {
                this.loggerInstance.info('Got new message...');
                const message = Message.createFromMessage(json);
                this.emit(events.MESSAGE_RECEIVED, message);
            }
        });
    }

    hasGoneUp() {
        return (super.hasGoneUp()
            && this.startupFiredEvents.includes(events.GC_UP)
            && this.startupFiredEvents.includes(events.HEARTBEAT_UP));
    }

    hasGoneDown() {
        return (super.hasGoneDown()
            && this.shutdownFiredEvents.includes(events.GC_DOWN)
            && this.shutdownFiredEvents.includes(events.HEARTBEAT_DOWN));
    }

    registerEventsHandlers() {
        super.registerEventsHandlers();
        this.on(events.HEARTBEAT_UP, () => this.handleStartupEvent(events.HEARTBEAT_UP));
        this.on(events.HEARTBEAT_DOWN, () => this.handleShutdownEvent(events.HEARTBEAT_DOWN));
        this.on(events.GC_UP, () => this.handleStartupEvent(events.GC_UP));
        this.on(events.GC_DOWN, () => this.handleShutdownEvent(events.GC_DOWN));
        this.on(events.STATS_UP, () => {
            this.statsInstance.consumerStats();
            this.statsInstance.startAggregator();
        });
        this.on(events.SCHEDULER_UP, () => {
            this.schedulerInstance.runTicker();
        });
        this.on(events.GOING_UP, () => {
            this.heartBeatInstance.start();
            this.garbageCollectorInstance.start();
        });
        this.on(events.GOING_DOWN, () => {
            this.heartBeatInstance.stop();
            this.garbageCollectorInstance.stop();
        });
        this.on(events.UP, () => {
            this.emit(events.MESSAGE_NEXT);
        });
        this.on(events.MESSAGE_NEXT, () => {
            if (this.isRunning()) {
                this.getNextMessage();
            }
        });
        this.on(events.MESSAGE_RECEIVED, (message) => {
            if (this.isRunning()) {
                if (this.statsInstance) this.statsInstance.incrementProcessingSlot();
                if (this.garbageCollectorInstance.hasExpired(message)) {
                    this.emit(events.MESSAGE_EXPIRED, message);
                } else this.handleConsume(message);
            }
        });
        this.on(events.MESSAGE_EXPIRED, (message) => {
            this.loggerInstance.info(`Message [${message.uuid}] has expired`);
            const { keyQueueNameProcessing } = this.getInstanceRedisKeys();
            this.garbageCollectorInstance.collectExpiredMessage(
                message,
                keyQueueNameProcessing,
                () => {
                    if (this.statsInstance) this.statsInstance.incrementAcknowledgedSlot();
                    this.loggerInstance.info(`Message [${message.uuid}] successfully processed`);
                    this.emit(events.MESSAGE_NEXT);
                },
            );
        });
        this.on(events.MESSAGE_ACKNOWLEDGED, () => {
            if (this.statsInstance) this.statsInstance.incrementAcknowledgedSlot();
            this.emit(events.MESSAGE_NEXT);
        });
        this.on(events.MESSAGE_UNACKNOWLEDGED, (msg) => {
            if (this.statsInstance) this.statsInstance.incrementUnacknowledgedSlot();
            const keys = this.getInstanceRedisKeys();
            this.garbageCollectorInstance.collectMessage(msg, keys.keyQueueNameProcessing, (err) => {
                if (err) this.error(err);
                else this.emit(events.MESSAGE_NEXT);
            });
        });
        this.on(events.MESSAGE_CONSUME_TIMEOUT, (message) => {
            this.handleConsumeFailure(
                message,
                new Error(`Consumer timed out after [${this.getConsumerMessageConsumeTimeout()}]`),
            );
        });
    }

    setupHeartBeat() {
        this.heartBeatInstance = HeartBeat(this);
    }

    setupGarbageCollector() {
        this.garbageCollectorInstance = GarbageCollector(this);
    }

    setupQueues() {
        const { keyQueueNameProcessing } = this.getInstanceRedisKeys();
        util.rememberProcessingQueue(this.redisClientInstance, keyQueueNameProcessing, (err) => {
            if (err) this.error(err);
            else super.setupQueues();
        });
    }

    completeBootstrap() {
        this.setupHeartBeat();
        this.setupGarbageCollector();
        super.completeBootstrap();
    }

    handleConsume(msg) {
        let isTimeout = false;
        let timer = null;
        const timeout = msg.getConsumeTimeout();
        const consumeTimeout = typeof timeout === 'number' ? timeout : this.getConsumerMessageConsumeTimeout();
        this.loggerInstance.info(`Processing message [${msg.getId()}]...`);
        const keys = this.getInstanceRedisKeys();
        try {
            if (consumeTimeout) {
                timer = setTimeout(() => {
                    isTimeout = true;
                    timer = null;
                    this.emit(events.MESSAGE_CONSUME_TIMEOUT, msg);
                }, consumeTimeout);
            }
            const onDeleted = (err) => {
                if (err) this.error(err);
                else {
                    this.loggerInstance.info(`Message [${msg.getId()}] successfully processed`);
                    this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
                }
            };
            const onConsumed = (err) => {
                if (this.isRunning() && !isTimeout) {
                    if (timer) clearTimeout(timer);
                    if (err) this.handleConsumeFailure(msg, err);
                    else this.redisClientInstance.rpop(keys.keyQueueNameProcessing, onDeleted);
                }
            };
            this.consume(msg.getBody(), onConsumed);
        } catch (error) {
            this.handleConsumeFailure(msg, error);
        }
    }

    handleConsumeFailure(msg, error) {
        this.loggerInstance.error(`Consumer failed to consume message [${msg.uuid}]...`);
        this.loggerInstance.error(error);
        this.emit(events.MESSAGE_UNACKNOWLEDGED, msg);
    }

    consume(message, cb) {
        /* eslint class-methods-use-this: 0 */
        throw new Error('Consume method should be extended');
    }
}

module.exports = Consumer;
