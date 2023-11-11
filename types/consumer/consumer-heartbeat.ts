export interface IConsumerHeartbeat {
  timestamp: number;
  data: IConsumerHeartbeatPayload;
}

export interface IConsumerHeartbeatPayload {
  ram: { usage: NodeJS.MemoryUsage; free: number; total: number };
  cpu: { user: number; system: number; percentage: string };
}
