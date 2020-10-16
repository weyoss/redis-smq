'use strict';

const uuid = require('uuid/v4');
const { EventEmitter } = require('events');
const redisClient = require('./redis-client');
const Stats = require('./stats');
const Scheduler = require('./scheduler');
const logger = require('./logger');
const util = require('./util');
const redisKeys = require('./redis-keys');
const events = require('./events');
const PowerStateManager = require('./power-state-manager');

class Instance extends EventEmitter {
    /**
     * See docs.
     *
     * @param {object} config
     */
    constructor(config) {
        super();
        this.id = uuid();
        this.config = config;
        this.startupFiredEvents = [];
        this.shutdownFiredEvents = [];
        this.bootstrapping = false;
        this.powerStateManager = PowerStateManager();
        if (config.hasOwnProperty('namespace')) {
            redisKeys.setNamespace(config.namespace);
        }
        this.registerEventsHandlers();
    }

    /**
     * @protected
     */
    registerEventsHandlers() {
        this.on(events.ERROR, (err) => this.error(err));
        this.on(events.BOOTSTRAP_REDIS_CLIENT, () => this.setupQueues());
        this.on(events.BOOTSTRAP_SYSTEM_QUEUES, () => this.completeBootstrap());
        this.on(events.BOOTSTRAP_SUCCESS, () => {
            this.bootstrapping = false;
            this.emit(events.GOING_UP);
        });
        this.on(events.GOING_UP, () => {
            this.schedulerInstance.start();
            if (this.statsInstance) this.statsInstance.start();
        });
        this.on(events.UP, () => {
            this.startupFiredEvents = [];
        });
        this.on(events.GOING_DOWN, () => {
            if (this.statsInstance) this.statsInstance.stop();
            this.schedulerInstance.stop();
            this.redisClientInstance.end(true);
            this.redisClientInstance = null;
        });
        this.on(events.DOWN, () => {
            this.shutdownFiredEvents = [];
            this.statsInstance = null;
            this.schedulerInstance = null;
        });
        this.on(events.SCHEDULER_UP, () => this.handleStartupEvent(events.SCHEDULER_UP));
        this.on(events.SCHEDULER_DOWN, () => this.handleShutdownEvent(events.SCHEDULER_DOWN));
        this.on(events.STATS_UP, () => this.handleStartupEvent(events.STATS_UP));
        this.on(events.STATS_UP, () => this.handleStartupEvent(events.STATS_UP));
        this.on(events.STATS_DOWN, () => this.handleShutdownEvent(events.STATS_DOWN));
    }

    /**
     * @return {string}
     */
    getId() {
        return this.id;
    }

    /**
     * @return {object}
     */
    getConfig() {
        return this.config;
    }

    /**
     * @protected
     * @param {string} name
     */
    setQueueName(name) {
        redisKeys.validateKeyPart(name);
        this.queueName = name;
    }

    /**
     * @return {string}
     */
    getQueueName() {
        if (!this.queueName) {
            throw new Error('Queue name has not been provided');
        }
        return this.queueName;
    }

    /**
     * @return {object}
     */
    getInstanceRedisKeys() {
        if (!this.redisKeys) {
            this.redisKeys = this.getRedisKeys();
        }
        return this.redisKeys;
    }

    /**
     * @protected
     */
    getRedisKeys() {
        /* eslint class-methods-use-this: 0 */
        throw new Error('Method not implemented!');
    }

    /**
     * @protected
     */
    getStatsProvider() {
        /* eslint class-methods-use-this: 0 */
        throw new Error('Method not implemented!');
    }

    /**
     * @protected
     */
    setupStats() {
        const { monitor } = this.config;
        if (monitor && monitor.enabled) {
            const statsProvider = this.getStatsProvider();
            this.statsInstance = Stats(this, statsProvider);
        }
    }

    /**
     * @protected
     */
    setupScheduler() {
        this.schedulerInstance = Scheduler(this);
    }

    /**
     * @return {object}
     */
    getScheduler() {
        return this.schedulerInstance;
    }

    /**
     * @return {object}
     */
    getLogger() {
        if (!this.loggerInstance) {
            this.loggerInstance = logger.getNewInstance(`${this.getQueueName()}:${this.getId()}`, this.config.log);
        }
        return this.loggerInstance;
    }

    /**
     * @protected
     */
    setupRedisClient() {
        redisClient.getNewInstance(this.config, (client) => {
            this.redisClientInstance = client;
            this.emit(events.BOOTSTRAP_REDIS_CLIENT);
        });
    }

    /**
     * @protected
     */
    setupQueues() {
        const { keyQueueName, keyQueueNameDead } = this.getInstanceRedisKeys();
        const deadLetterQueue = () => {
            util.rememberDLQueue(this.redisClientInstance, keyQueueNameDead, (err) => {
                if (err) this.error(err);
                else this.emit(events.BOOTSTRAP_SYSTEM_QUEUES);
            });
        };
        util.rememberMessageQueue(this.redisClientInstance, keyQueueName, (err) => {
            if (err) this.error(err);
            else deadLetterQueue();
        });
    }

    /**
     * @protected
     * @param {string} event
     */
    handleStartupEvent(event) {
        this.startupFiredEvents.push(event);
        const isUp = this.hasGoneUp();
        if (isUp) {
            this.powerStateManager.up();
            this.emit(events.UP);
        }
    }

    /**
     * @protected
     * @param {string} event
     */
    handleShutdownEvent(event) {
        this.shutdownFiredEvents.push(event);
        const isDown = this.hasGoneDown();
        if (isDown) {
            this.powerStateManager.down();
            this.emit(events.DOWN);
        }
    }

    /**
     * @protected
     * @return {boolean}
     */
    hasGoneUp() {
        return (
            this.startupFiredEvents.includes(events.SCHEDULER_UP) &&
            (!this.statsInstance || this.startupFiredEvents.includes(events.STATS_UP))
        );
    }

    /**
     * @protected
     * @return {boolean}
     */
    hasGoneDown() {
        return (
            this.shutdownFiredEvents.includes(events.SCHEDULER_DOWN) &&
            (!this.statsInstance || this.shutdownFiredEvents.includes(events.STATS_DOWN))
        );
    }

    /**
     * @param {Error} err
     */
    error(err) {
        if (this.powerStateManager.isRunning()) {
            this.shutdown();
            throw err;
        }
    }

    /**
     * Overwrite this method to do extra bootstrapping before starting up
     * This method should always emit 'BOOTSTRAP_SUCCESS' once bootstrap completed
     *
     * @protected
     */
    completeBootstrap() {
        this.emit(events.BOOTSTRAP_SUCCESS);
    }

    /**
     * @protected
     */
    bootstrap() {
        this.bootstrapping = true;
        this.setupStats();
        this.setupScheduler();
        this.setupRedisClient();
    }

    run() {
        this.powerStateManager.goingUp();
        this.bootstrap();
    }

    shutdown() {
        this.powerStateManager.goingDown();
        this.emit(events.GOING_DOWN);
    }

    /**
     *
     * @return {boolean}
     */
    isBootstrapping() {
        return this.bootstrapping === true;
    }
}

module.exports = Instance;
