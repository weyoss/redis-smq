import { Scheduler } from '../../system/scheduler';
import { RedisClient } from '../../system/redis-client';
import { TGetScheduledMessagesReply } from '../../../types';
import { GetScheduledMessagesRequestDTO as GetSchedulerMessagesDTO } from '../controllers/scheduler/actions/get-scheduled-messages/get-scheduled-messages-request.DTO';
import { DeleteScheduledMessageRequestDTO as DeletedScheduledMessageDTO } from '../controllers/scheduler/actions/delete-scheduled-message/delete-scheduled-message-request.DTO';

export class SchedulerService {
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async getSchedulerMessages(
    args: GetSchedulerMessagesDTO,
  ): Promise<TGetScheduledMessagesReply> {
    const { queueName, skip = 0, take = 1 } = args;
    return new Promise<TGetScheduledMessagesReply>((resolve, reject) => {
      Scheduler.getScheduledMessages(
        this.redisClient,
        queueName,
        skip,
        take,
        (err, reply) => {
          if (err) reject(err);
          else if (!reply) reject();
          else resolve(reply);
        },
      );
    });
  }

  async deleteScheduledMessage(
    args: DeletedScheduledMessageDTO,
  ): Promise<void> {
    const { id, queueName } = args;
    const scheduler = new Scheduler(queueName, this.redisClient);
    return new Promise<void>((resolve, reject) => {
      scheduler.deleteScheduledMessage(id, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
