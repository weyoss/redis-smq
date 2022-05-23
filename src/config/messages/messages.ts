import { IConfig, IRequiredConfig } from '../../../types';
import { merge } from 'lodash';
import Store from './store';
import ConsumeOptions from './consume-options';

const defaultConfig: IRequiredConfig['messages'] = {
  consumeOptions: {
    consumeTimeout: 0,
    retryThreshold: 3,
    retryDelay: 60000,
    ttl: 0,
  },
  store: {
    acknowledged: {
      store: false,
      queueSize: 0,
      expire: 0,
    },
    deadLettered: {
      store: false,
      queueSize: 0,
      expire: 0,
    },
  },
};

export default function Messages(
  userConfig: IConfig,
): IRequiredConfig['messages'] {
  const consumeOptions = ConsumeOptions(userConfig);
  const store = Store(userConfig);
  return merge({}, defaultConfig, { consumeOptions, store });
}
