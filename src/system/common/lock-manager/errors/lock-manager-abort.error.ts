import { LockManagerError } from './lock-manager.error';

export class LockManagerAbortError extends LockManagerError {
  constructor(message = `releaseLock() may have been called. Abandoning.`) {
    super(message);
  }
}
