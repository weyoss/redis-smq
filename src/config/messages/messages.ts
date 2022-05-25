import { IConfig, IRequiredConfig } from '../../../types';
import { merge } from 'lodash';
import Store from './store';

const defaultConfig: IRequiredConfig['messages'] = {
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
  const store = Store(userConfig);
  return merge({}, defaultConfig, { store });
}
