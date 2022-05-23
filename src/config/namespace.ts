import { IConfig } from '../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';

const defaultNamespace = 'default';

export default function Namespace(userConfig: IConfig): string {
  const namespace = userConfig.namespace ?? defaultNamespace;
  redisKeys.setNamespace(namespace);
  return namespace;
}
