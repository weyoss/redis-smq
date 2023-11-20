import { ProducerError } from './producer.error';

export class ProducerInstanceNotRunningError extends ProducerError {
  constructor(
    msg = `Producer instance is not running. Before producing messages you need to run your producer instance.`,
  ) {
    super(msg);
  }
}
