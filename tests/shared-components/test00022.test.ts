import Monitor from '../../src/system/common/configuration/monitor';

test('Configuration: monitor.basePath', async () => {
  expect(() => {
    Monitor({
      monitor: {
        enabled: true,
        basePath: '//',
      },
    });
  }).toThrow('Invalid [monitor.basePath] value');

  expect(() => {
    Monitor({
      monitor: {
        enabled: true,
        basePath: '',
      },
    });
  }).toThrow('Invalid [monitor.basePath] value');

  expect(() => {
    Monitor({
      monitor: {
        enabled: true,
        basePath: '\\',
      },
    });
  }).toThrow('Invalid [monitor.basePath] value');

  expect(() => {
    Monitor({
      monitor: {
        enabled: true,
        basePath: 'abc',
      },
    });
  }).toThrow('Invalid [monitor.basePath] value');

  expect(() => {
    Monitor({
      monitor: {
        enabled: true,
        basePath: 'abc/def',
      },
    });
  }).toThrow('Invalid [monitor.basePath] value');

  Monitor({
    monitor: {
      enabled: true,
      basePath: '/',
    },
  });

  Monitor({
    monitor: {
      enabled: true,
      basePath: '/abc',
    },
  });

  Monitor({
    monitor: {
      enabled: true,
      basePath: '/abc/223/a-3_d',
    },
  });

  Monitor({
    monitor: {
      enabled: true,
      basePath: '/abc/def/',
    },
  });
});
