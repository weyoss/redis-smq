'use strict';

const Instance = require('./instance');
const HeartBeat = require('./heartbeat');
const GarbageCollector = require('./gc');
const Message = require('./message');
const events = require('./events');
const ConsumerStatsProvider = require('./consumer-stats-provider');
const ConsumerRedisKeys = require('./consumer-redis-keys');

class Consumer extends Instance {
    /**
     * See docs.
     *
     * @param {object} config
     * @param {object} options
     */
    constructor(config = {}, options = {}) {
        super(config);
        if (!this.constructor.hasOwnProperty('queueName') && !options.queueName) {
            throw new Error('Undefined queue name!');
        }
        this.setQueueName(this.constructor.queueName || options.queueName);
        this.options = options;
        this.consumerMessageTTL = options.hasOwnProperty('messageTTL') ? Number(options.messageTTL) : 0;
        this.consumerMessageConsumeTimeout = options.hasOwnProperty('messageConsumeTimeout')
            ? Number(options.messageConsumeTimeout)
            : 0;
        this.messageRetryThreshold = options.hasOwnProperty('messageRetryThreshold')
            ? Number(options.messageRetryThreshold)
            : 3;
        this.messageRetryDelay = options.hasOwnProperty('messageRetryDelay') ? Number(options.messageRetryDelay) : 0;
    }

    /**
     * @return {number}
     */
    getConsumerMessageConsumeTimeout() {
        return this.consumerMessageConsumeTimeout;
    }

    /**
     * @return {number}
     */
    getMessageRetryThreshold() {
        return this.messageRetryThreshold;
    }

    /**
     * @return {number}
     */
    getConsumerMessageTTL() {
        return this.consumerMessageTTL;
    }

    /**
     * @return {number}
     */
    getMessageRetryDelay() {
        return this.messageRetryDelay;
    }

    /**
     * @protected
     * @return {object}
     */
    getRedisKeys() {
        return new ConsumerRedisKeys(this.getId(), this.getQueueName());
    }

    /**
     * @protected
     */
    getStatsProvider() {
        if (!this.statsProvider) {
            this.statsProvider = ConsumerStatsProvider(this);
        }
        return this.statsProvider;
    }

    /**
     * @protected
     */
    getNextMessage() {
        this.loggerInstance.info('Waiting for new messages...');
        const { keyQueue, keyConsumerProcessingQueue } = this.getInstanceRedisKeys();
        this.redisClientInstance.brpoplpush(keyQueue, keyConsumerProcessingQueue, 0, (err, json) => {
            if (err) this.error(err);
            else {
                this.loggerInstance.info('Got new message...');
                const message = Message.createFromMessage(json);
                this.emit(events.MESSAGE_RECEIVED, message);
            }
        });
    }

    /**
     * @protected
     * @return {boolean}
     */
    hasGoneUp() {
        return (
            super.hasGoneUp() &&
            this.startupFiredEvents.includes(events.GC_UP) &&
            this.startupFiredEvents.includes(events.HEARTBEAT_UP)
        );
    }

    /**
     * @protected
     * @return {boolean}
     */
    hasGoneDown() {
        return (
            super.hasGoneDown() &&
            this.shutdownFiredEvents.includes(events.GC_DOWN) &&
            this.shutdownFiredEvents.includes(events.HEARTBEAT_DOWN)
        );
    }

    /**
     * @protected
     */
    registerEventsHandlers() {
        super.registerEventsHandlers();
        this.on(events.HEARTBEAT_UP, () => this.handleStartupEvent(events.HEARTBEAT_UP));
        this.on(events.HEARTBEAT_DOWN, () => this.handleShutdownEvent(events.HEARTBEAT_DOWN));
        this.on(events.GC_UP, () => this.handleStartupEvent(events.GC_UP));
        this.on(events.GC_DOWN, () => this.handleShutdownEvent(events.GC_DOWN));
        this.on(events.STATS_UP, () => {
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
        this.on(events.DOWN, () => {
            this.garbageCollectorInstance = null;
            this.heartBeatInstance = null;
            this.statsProvider = null;
        });
        this.on(events.UP, () => {
            this.emit(events.MESSAGE_NEXT);
        });
        this.on(events.MESSAGE_NEXT, () => {
            if (this.powerStateManager.isRunning()) {
                this.getNextMessage();
            }
        });
        this.on(events.MESSAGE_RECEIVED, (message) => {
            const messageCollector = this.garbageCollectorInstance.getMessageCollector();
            if (this.powerStateManager.isRunning()) {
                if (this.statsProvider) this.statsProvider.incrementProcessingSlot();
                if (messageCollector.hasMessageExpired(message)) {
                    this.emit(events.MESSAGE_EXPIRED, message);
                } else this.handleConsume(message);
            }
        });
        this.on(events.MESSAGE_EXPIRED, (message) => {
            this.loggerInstance.info(`Message [${message.uuid}] has expired`);
            const { keyConsumerProcessingQueue } = this.getInstanceRedisKeys();
            const messageCollector = this.garbageCollectorInstance.getMessageCollector();
            messageCollector.collectExpiredMessage(message, keyConsumerProcessingQueue, () => {
                if (this.statsProvider) this.statsProvider.incrementAcknowledgedSlot();
                this.loggerInstance.info(`Message [${message.uuid}] successfully processed`);
                this.emit(events.MESSAGE_NEXT);
            });
        });
        this.on(events.MESSAGE_ACKNOWLEDGED, () => {
            if (this.statsProvider) this.statsProvider.incrementAcknowledgedSlot();
            this.emit(events.MESSAGE_NEXT);
        });
        this.on(events.MESSAGE_UNACKNOWLEDGED, (msg) => {
            if (this.statsProvider) this.statsProvider.incrementUnacknowledgedSlot();
            const keys = this.getInstanceRedisKeys();
            const messageCollector = this.garbageCollectorInstance.getMessageCollector();
            messageCollector.collectMessage(msg, keys.keyConsumerProcessingQueue, (err) => {
                if (err) this.error(err);
                else this.emit(events.MESSAGE_NEXT);
            });
        });
        this.on(events.MESSAGE_CONSUME_TIMEOUT, (message) => {
            this.handleConsumeFailure(
                message,
                new Error(`Consumer timed out after [${this.getConsumerMessageConsumeTimeout()}]`)
            );
        });
    }

    /**
     * @protected
     */
    setupHeartBeat() {
        this.heartBeatInstance = HeartBeat(this);
    }

    /**
     * @protected
     */
    setupGarbageCollector() {
        this.garbageCollectorInstance = GarbageCollector(this);
    }

    /**
     * @protected
     */
    setupQueues() {
        const {
            keyConsumerProcessingQueue,
            keyIndexQueueProcessing,
            keyIndexQueueQueuesProcessing
        } = this.getInstanceRedisKeys();
        const multi = this.redisClientInstance.multi();
        multi.hset(keyIndexQueueQueuesProcessing, keyConsumerProcessingQueue, this.getId());
        multi.sadd(keyIndexQueueProcessing, keyConsumerProcessingQueue);
        multi.exec((err) => {
            if (err) this.error(err);
            else super.setupQueues();
        });
    }

    /**
     * @protected
     */
    completeBootstrap() {
        this.setupHeartBeat();
        this.setupGarbageCollector();
        super.completeBootstrap();
    }

    /**
     *
     * @param {Message} msg
     * @protected
     */
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
            const acknowledgeMessage = () => {
                this.redisClientInstance.rpop(keys.keyConsumerProcessingQueue, (err) => {
                    if (err) this.error(err);
                    else {
                        this.loggerInstance.info(`Message [${msg.getId()}] successfully processed`);
                        this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
                    }
                });
            };
            const onConsumed = (err) => {
                if (this.powerStateManager.isRunning() && !isTimeout) {
                    if (timer) clearTimeout(timer);
                    if (err) this.handleConsumeFailure(msg, err);
                    else acknowledgeMessage();
                }
            };
            this.consume(msg.getBody(), onConsumed);
        } catch (error) {
            this.handleConsumeFailure(msg, error);
        }
    }

    /**
     *
     * @param {Message} msg
     * @param {Error} error
     * @protected
     */
    handleConsumeFailure(msg, error) {
        this.loggerInstance.error(`Consumer failed to consume message [${msg.getId()}]...`);
        this.loggerInstance.error(error);
        this.emit(events.MESSAGE_UNACKNOWLEDGED, msg);
    }

    /**
     *
     * @param {*} message
     * @param {function} cb
     */
    consume(message, cb) {
        /* eslint class-methods-use-this: 0 */
        throw new Error('Consume method should be extended');
    }
}

module.exports = Consumer;
