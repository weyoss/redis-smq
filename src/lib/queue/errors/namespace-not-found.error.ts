import { errors } from 'redis-smq-common';

export class NamespaceNotFoundError extends errors.RedisSMQError {
  constructor(namespace: string) {
    super(`Namespace (${namespace}) does not exist`);
  }
}
