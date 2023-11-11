import { IRedisSMQConfig } from '../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';

const defaultNamespace = 'default';

export default function Namespace(userConfig: IRedisSMQConfig): string {
  if (!userConfig.namespace) return defaultNamespace;
  return redisKeys.validateNamespace(userConfig.namespace);
}
