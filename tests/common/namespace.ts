import { promisifyAll } from 'bluebird';
import { Namespace } from '../../src/lib/queue/namespace';

export async function getNamespace() {
  return promisifyAll(new Namespace());
}
