import { IRedisSMQConfig, IRedisSMQConfigRequired } from '../../types';
import { merge } from 'lodash';

const defaultConfig: IRedisSMQConfigRequired['logger'] = {
  enabled: false,
};

export default function Logger(
  userConfig: IRedisSMQConfig,
): IRedisSMQConfigRequired['logger'] {
  return merge({}, defaultConfig, userConfig.logger ?? {});
}
