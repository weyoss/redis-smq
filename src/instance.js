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

const states = {
    DOWN: 0,
    UP: 1
};

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
        this.state = states.DOWN;
        this.stateSwitching = false;
        this.bootstrapping = false;
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
            this.switchState(states.UP);
        });
        this.on(events.GOING_UP, () => {
            this.schedulerInstance.start();
            this.statsInstance.start();
        });
        this.on(events.UP, () => {
            this.startupFiredEvents = [];
        });
        this.on(events.GOING_DOWN, () => {
            this.statsInstance.stop();
            this.schedulerInstance.stop();
            this.redisClientInstance.end(true);
            this.redisClientInstance = null;
        });
        this.on(events.DOWN, () => {
            this.shutdownFiredEvents = [];
            this.garbageCollectorInstance = null;
            this.heartBeatInstance = null;
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
     * @protected
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
    setupStats() {
        const { monitor } = this.config;
        if (monitor && monitor.enabled) {
            this.statsInstance = Stats(this);
        }
    }

    /**
     * @protected
     */
    setupScheduler() {
        this.schedulerInstance = Scheduler(this);
    }

    /**
     * @protected
     * @return {object}
     */
    getScheduler() {
        return this.schedulerInstance;
    }

    /**
     * @protected
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
        if (isUp) this.setState(states.UP);
    }

    /**
     * @protected
     * @param {string} event
     */
    handleShutdownEvent(event) {
        this.shutdownFiredEvents.push(event);
        const isDown = this.hasGoneDown();
        if (isDown) this.setState(states.DOWN);
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
     * @protected
     * @param {number} state
     */
    setState(state) {
        this.stateSwitching = false;
        this.state = state;
        if (this.state === states.UP) {
            this.emit(events.UP);
        } else this.emit(events.DOWN);
    }

    /**
     * @protected
     * @param {Error} err
     */
    error(err) {
        if (this.isRunning()) {
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
        if (this.isDown()) {
            this.bootstrap();
        }
    }

    shutdown() {
        if (this.isRunning()) {
            this.switchState(states.DOWN);
        }
    }

    /**
     * @protected
     * @param {number} s
     */
    switchState(s) {
        if (!Object.values(states).includes(s)) {
            throw new Error('Can not switch to invalid state');
        }
        if (this.stateSwitching) {
            throw new Error('Can not switch state while another state transition is in progress');
        }
        this.stateSwitching = true;
        if (s === states.UP) this.emit(events.GOING_UP);
        else this.emit(events.GOING_DOWN);
    }

    /**
     *
     * @return {boolean}
     */
    isUp() {
        return this.state === states.UP;
    }

    /**
     *
     * @return {boolean}
     */
    isDown() {
        return this.state === states.DOWN;
    }

    /**
     *
     * @return {boolean}
     */
    isGoingUp() {
        return this.isDown() && this.stateSwitching;
    }

    /**
     *
     * @return {boolean}
     */
    isGoingDown() {
        return this.isUp() && this.stateSwitching;
    }

    /**
     *
     * @return {boolean}
     */
    isRunning() {
        return this.isUp() && !this.isGoingDown();
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
