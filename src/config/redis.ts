import { IRedisSMQConfig, IRedisSMQConfigRequired } from '../../types';
import { merge } from 'lodash';
import { ERedisConfigClient } from 'redis-smq-common';

const defaultConfig: IRedisSMQConfigRequired['redis'] = {
  client: ERedisConfigClient.IOREDIS,
};

export default function Redis(
  userConfig: IRedisSMQConfig,
): IRedisSMQConfigRequired['redis'] {
  return merge({}, defaultConfig, userConfig.redis ?? {});
}
