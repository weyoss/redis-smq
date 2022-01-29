export const events = {
  GOING_UP: 'going_up',
  UP: 'up',
  GOING_DOWN: 'going_down',
  DOWN: 'down',
  ERROR: 'error',
  IDLE: 'idle',
  SHUTDOWN_READY: 'shutdown_ready',

  MESSAGE_PUBLISHED: 'message_produced',
  MESSAGE_NEXT: 'message_next',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_ACKNOWLEDGED: 'message_acknowledged',
  MESSAGE_UNACKNOWLEDGED: 'message_unacknowledged',
  MESSAGE_DEAD_LETTERED: 'message_dead_lettered',

  RATE_TICK: 'rate_tick',
  HEARTBEAT_TICK: 'heartbeat_tick',
  WORKER_RUNNER_WORKERS_STARTED: 'worker_runner_workers_started',
};
