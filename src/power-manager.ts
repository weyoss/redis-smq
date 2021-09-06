enum TStates {
  UP,
  DOWN,
}

export class PowerManager {
  protected state: TStates = TStates.DOWN;
  protected pendingState: TStates | null = null;

  protected switchState(s: TStates): void {
    if (this.pendingState !== null) {
      throw new Error(
        'Can not switch state while another state transition is in progress.',
      );
    }
    if (s === this.state) {
      throw new Error('Can not switch to the same current state.');
    }
    this.pendingState = s;
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

  goingUp(): void {
    this.switchState(TStates.UP);
  }

  goingDown(): void {
    this.switchState(TStates.DOWN);
  }

  commit(): void {
    if (this.pendingState === null) {
      throw new Error();
    }
    this.state = this.pendingState;
    this.pendingState = null;
  }
}
