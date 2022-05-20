import { LockManagerError } from './lock-manager.error';

export class LockManagerAcquireError extends LockManagerError {
  constructor(message = `Could not acquire a lock`) {
    super(message);
  }
}
