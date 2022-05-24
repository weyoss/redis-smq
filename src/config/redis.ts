import { IConfig, IRequiredConfig } from '../../types';
import { merge } from 'lodash';
import { RedisClientName } from 'redis-smq-common/dist/types';

const defaultConfig: IRequiredConfig['redis'] = {
  client: RedisClientName.IOREDIS,
};

export default function Redis(userConfig: IConfig): IRequiredConfig['redis'] {
  return merge({}, defaultConfig, userConfig.redis ?? {});
}
