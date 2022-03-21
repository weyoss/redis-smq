import MessageStorage from '../../src/system/common/configuration/message-storage';

test('Configuration: storeMessages', async () => {
  expect(() => {
    MessageStorage({
      storeMessages: {
        acknowledged: {
          queueSize: -11,
        },
      },
    });
  }).toThrow(`Parameter [queueSize] should be >= 0`);

  expect(() => {
    MessageStorage({
      storeMessages: {
        acknowledged: {
          expire: -7,
        },
      },
    });
  }).toThrow(`Parameter [expire] should be >= 0`);

  const config = MessageStorage({});
  expect(config.deadLettered.store).toEqual(false);
  expect(config.deadLettered.expire).toEqual(0);
  expect(config.deadLettered.queueSize).toEqual(0);
  expect(config.acknowledged.store).toEqual(false);
  expect(config.acknowledged.expire).toEqual(0);
  expect(config.acknowledged.queueSize).toEqual(0);

  const config2 = MessageStorage({ storeMessages: false });
  expect(config2.deadLettered.store).toEqual(false);
  expect(config2.deadLettered.expire).toEqual(0);
  expect(config2.deadLettered.queueSize).toEqual(0);
  expect(config2.acknowledged.store).toEqual(false);
  expect(config2.acknowledged.expire).toEqual(0);
  expect(config2.acknowledged.queueSize).toEqual(0);

  const config3 = MessageStorage({ storeMessages: true });
  expect(config3.deadLettered.store).toEqual(true);
  expect(config3.deadLettered.expire).toEqual(0);
  expect(config3.deadLettered.queueSize).toEqual(0);
  expect(config3.acknowledged.store).toEqual(true);
  expect(config3.acknowledged.expire).toEqual(0);
  expect(config3.acknowledged.queueSize).toEqual(0);

  const config4 = MessageStorage({ storeMessages: {} });
  expect(config4.deadLettered.store).toEqual(false);
  expect(config4.deadLettered.expire).toEqual(0);
  expect(config4.deadLettered.queueSize).toEqual(0);
  expect(config4.acknowledged.store).toEqual(false);
  expect(config4.acknowledged.expire).toEqual(0);
  expect(config4.acknowledged.queueSize).toEqual(0);

  const config5 = MessageStorage({
    storeMessages: { acknowledged: false },
  });
  expect(config5.deadLettered.store).toEqual(false);
  expect(config5.deadLettered.expire).toEqual(0);
  expect(config5.deadLettered.queueSize).toEqual(0);
  expect(config5.acknowledged.store).toEqual(false);
  expect(config5.acknowledged.expire).toEqual(0);
  expect(config5.acknowledged.queueSize).toEqual(0);

  const config6 = MessageStorage({
    storeMessages: { acknowledged: true },
  });
  expect(config6.deadLettered.store).toEqual(false);
  expect(config6.deadLettered.expire).toEqual(0);
  expect(config6.deadLettered.queueSize).toEqual(0);
  expect(config6.acknowledged.store).toEqual(true);
  expect(config6.acknowledged.expire).toEqual(0);
  expect(config6.acknowledged.queueSize).toEqual(0);

  const config7 = MessageStorage({
    storeMessages: { acknowledged: true, deadLettered: false },
  });
  expect(config7.deadLettered.store).toEqual(false);
  expect(config7.deadLettered.expire).toEqual(0);
  expect(config7.deadLettered.queueSize).toEqual(0);
  expect(config7.acknowledged.store).toEqual(true);
  expect(config7.acknowledged.expire).toEqual(0);
  expect(config7.acknowledged.queueSize).toEqual(0);

  const config8 = MessageStorage({
    storeMessages: { acknowledged: true, deadLettered: true },
  });
  expect(config8.deadLettered.store).toEqual(true);
  expect(config8.deadLettered.expire).toEqual(0);
  expect(config8.deadLettered.queueSize).toEqual(0);
  expect(config8.acknowledged.store).toEqual(true);
  expect(config8.acknowledged.expire).toEqual(0);
  expect(config8.acknowledged.queueSize).toEqual(0);

  const config9 = MessageStorage({
    storeMessages: { acknowledged: {}, deadLettered: true },
  });
  expect(config9.deadLettered.store).toEqual(true);
  expect(config9.deadLettered.expire).toEqual(0);
  expect(config9.deadLettered.queueSize).toEqual(0);
  expect(config9.acknowledged.store).toEqual(true);
  expect(config9.acknowledged.expire).toEqual(0);
  expect(config9.acknowledged.queueSize).toEqual(0);

  const config10 = MessageStorage({
    storeMessages: {
      acknowledged: {
        expire: 90000,
      },
      deadLettered: true,
    },
  });
  expect(config10.deadLettered.store).toEqual(true);
  expect(config10.deadLettered.expire).toEqual(0);
  expect(config10.deadLettered.queueSize).toEqual(0);
  expect(config10.acknowledged.store).toEqual(true);
  expect(config10.acknowledged.expire).toEqual(90000);
  expect(config10.acknowledged.queueSize).toEqual(0);

  const config11 = MessageStorage({
    storeMessages: {
      acknowledged: {
        expire: 90000,
        queueSize: 10000,
      },
      deadLettered: {
        expire: 18000,
        queueSize: 20000,
      },
    },
  });
  expect(config11.deadLettered.store).toEqual(true);
  expect(config11.deadLettered.expire).toEqual(18000);
  expect(config11.deadLettered.queueSize).toEqual(20000);
  expect(config11.acknowledged.store).toEqual(true);
  expect(config11.acknowledged.expire).toEqual(90000);
  expect(config11.acknowledged.queueSize).toEqual(10000);
});
