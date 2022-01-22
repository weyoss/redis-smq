import { PowerManagerError } from './power-manager.error';

enum TStates {
  UP,
  DOWN,
}

export class PowerManager {
  protected throwExceptionOnError: boolean;
  protected state: TStates = TStates.DOWN;
  protected pendingState: TStates | null = null;

  constructor(throwExceptionOnError = true) {
    this.throwExceptionOnError = throwExceptionOnError;
  }

  protected switchState(s: TStates): boolean {
    if (this.pendingState !== null) {
      if (this.throwExceptionOnError) {
        throw new PowerManagerError(
          'Can not switch state while another state transition is in progress.',
        );
      }
      return false;
    }

    if (s === this.state) {
      if (this.throwExceptionOnError) {
        throw new PowerManagerError(
          'Can not switch to the same current state.',
        );
      }
      return false;
    }

    this.pendingState = s;
    return true;
  }

  isUp(): boolean {
    return this.state === TStates.UP;
  }

  isDown(): boolean {
    return this.state === TStates.DOWN;
  }

  isGoingUp(): boolean {
    return this.pendingState === TStates.UP;
  }

  isGoingDown(): boolean {
    return this.pendingState === TStates.DOWN;
  }

  isRunning(): boolean {
    return this.isUp() && !this.pendingState;
  }

  goingUp(): boolean {
    return this.switchState(TStates.UP);
  }

  goingDown(): boolean {
    return this.switchState(TStates.DOWN);
  }

  commit(): void {
    if (this.pendingState === null) {
      throw new PowerManagerError(`Expected a pending state`);
    }
    this.state = this.pendingState;
    this.pendingState = null;
  }

  rollback(): void {
    if (this.pendingState === null) {
      throw new PowerManagerError(`Expected a pending state`);
    }
    this.pendingState = null;
  }
}
