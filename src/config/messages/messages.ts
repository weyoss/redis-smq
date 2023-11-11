import { IRedisSMQConfig, IRedisSMQConfigRequired } from '../../../types';
import { merge } from 'lodash';
import Store from './store';

const defaultConfig: IRedisSMQConfigRequired['messages'] = {
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
  userConfig: IRedisSMQConfig,
): IRedisSMQConfigRequired['messages'] {
  const store = Store(userConfig);
  return merge({}, defaultConfig, { store });
}
