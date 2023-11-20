import { ProducerError } from './producer.error';

export class ProducerMessageAlreadyPublishedError extends ProducerError {
  constructor(
    msg = 'The message can not published. Either you have already published the message or you have called the getSetMessageState() method.',
  ) {
    super(msg);
  }
}
