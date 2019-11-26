const { getRedisInstance, shutdown } = require('./common');

let redisInstance = null;

// eslint-disable-next-line no-undef
beforeAll(async () => {
    if (!redisInstance) {
       redisInstance = await getRedisInstance();
    }
});

// eslint-disable-next-line no-undef
afterAll(async () => {
    if (redisInstance) {
        redisInstance.end(true);
        redisInstance = null;
    }
});

// eslint-disable-next-line no-undef
beforeEach(async () => {
    await redisInstance.flushall();
});

// eslint-disable-next-line no-undef
afterEach(async () => {
    await shutdown();
});

jest.setTimeout(160000);
