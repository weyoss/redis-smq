import { LockManagerError } from './lock-manager.error';

export class LockManagerExtendError extends LockManagerError {
  constructor(message = `Acquired lock could not be extended`) {
    super(message);
  }
}
