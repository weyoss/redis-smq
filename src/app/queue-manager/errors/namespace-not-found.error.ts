import { RedisSMQError } from '../../../common/errors/redis-smq.error';

export class NamespaceNotFoundError extends RedisSMQError {
  constructor(namespace: string) {
    super(`Namespace (${namespace}) does not exist`);
  }
}
