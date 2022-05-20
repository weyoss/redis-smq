import { IConfig, IRequiredConfig, RedisClientName } from '../../../types';
import { merge } from 'lodash';

const defaultConfig: IRequiredConfig['redis'] = {
  client: RedisClientName.IOREDIS,
};

export default function Redis(userConfig: IConfig): IRequiredConfig['redis'] {
  return merge({}, defaultConfig, userConfig.redis ?? {});
}
