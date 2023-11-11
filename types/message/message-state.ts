export interface IMessageStateSerialized {
  uuid: string;
  publishedAt: number | null;
  scheduledAt: number | null;
  lastScheduledAt: number | null;
  scheduledCronFired: boolean;
  attempts: number;
  scheduledRepeatCount: number;
  expired: boolean;
  nextScheduledDelay: number;
  nextRetryDelay: number;
  scheduledTimes: number;
  scheduledMessageId: string | null;
}
