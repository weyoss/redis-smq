import { QueueError } from './queue.error';

export class QueueNamespaceNotFoundError extends QueueError {
  constructor(namespace: string) {
    super(`Namespace (${namespace}) does not exist`);
  }
}
