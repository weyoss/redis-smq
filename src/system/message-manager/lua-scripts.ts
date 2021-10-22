import * as fs from 'fs';
import { ICallback } from '../../../types';
import * as async from 'async';
import { RedisClient } from '../redis-client';

export enum ELuaScriptName {
  DEQUEUE_MESSAGE_WITH_PRIORITY,
  DELETE_PENDING_MESSAGE,
  DELETE_PENDING_MESSAGE_WITH_PRIORITY,
  DELETE_ACKNOWLEDGED_MESSAGE,
  DELETE_SCHEDULED_MESSAGE,
  DELETE_DEAD_LETTER_MESSAGE,
  REQUEUE_ACKNOWLEDGED_MESSAGE,
  REQUEUE_ACKNOWLEDGED_MESSAGE_WITH_PRIORITY,
  REQUEUE_DEAD_LETTER_MESSAGE,
  REQUEUE_DEAD_LETTER_MESSAGE_WITH_PRIORITY,
  ENQUEUE_MESSAGE,
  ENQUEUE_MESSAGE_WITH_PRIORITY,
  ENQUEUE_SCHEDULED_MESSAGE,
  ENQUEUE_SCHEDULED_MESSAGE_WITH_PRIORITY,
  SCHEDULE_MESSAGE,
  ACKNOWLEDGE_MESSAGE,
  DEAD_LETTER_UNACKNOWLEDGED_MESSAGE,
  REQUEUE_UNACKNOWLEDGED_MESSAGE,
  SCHEDULE_UNACKNOWLEDGED_MESSAGE,
}

///

const deletePendingMessageScript = fs
  .readFileSync(`${__dirname}/lua/delete-pending-message.lua`)
  .toString();
const deleteMessageScript = fs
  .readFileSync(`${__dirname}/lua/delete-message.lua`)
  .toString();
const dequeueMessageFromPriorityQueue = fs
  .readFileSync(`${__dirname}/lua/dequeue-message-from-priority-queue.lua`)
  .toString();
const requeueMessage = fs
  .readFileSync(`${__dirname}/lua/requeue-message.lua`)
  .toString();
const enqueueMessageScript = fs
  .readFileSync(`${__dirname}/lua/enqueue-message.lua`)
  .toString();
const enqueueScheduledMessageScript = fs
  .readFileSync(`${__dirname}/lua/enqueue-scheduled-message.lua`)
  .toString();
const scheduleMessageScript = fs
  .readFileSync(`${__dirname}/lua/schedule-message.lua`)
  .toString();
const deadLetterUnacknowledgedMessageScript = fs
  .readFileSync(`${__dirname}/lua/dead-letter-unacknowledged-message.lua`)
  .toString();
const acknowledgeMessageScript = fs
  .readFileSync(`${__dirname}/lua/acknowledge-message.lua`)
  .toString();
const requeueUnacknowledgedMessageScript = fs
  .readFileSync(`${__dirname}/lua/requeue-unacknowledged-message.lua`)
  .toString();
const scheduleUnacknowledgedMessageScript = fs
  .readFileSync(`${__dirname}/lua/schedule-unacknowledged-message.lua`)
  .toString();

////

const scriptsMap = new Map<ELuaScriptName, { id?: string; content: string }>();
scriptsMap.set(ELuaScriptName.DELETE_PENDING_MESSAGE, {
  content: deletePendingMessageScript,
});
scriptsMap.set(ELuaScriptName.DELETE_PENDING_MESSAGE_WITH_PRIORITY, {
  content: deleteMessageScript,
});
scriptsMap.set(ELuaScriptName.DELETE_ACKNOWLEDGED_MESSAGE, {
  content: deleteMessageScript,
});
scriptsMap.set(ELuaScriptName.DELETE_DEAD_LETTER_MESSAGE, {
  content: deleteMessageScript,
});
scriptsMap.set(ELuaScriptName.DELETE_SCHEDULED_MESSAGE, {
  content: deleteMessageScript,
});
scriptsMap.set(ELuaScriptName.DEQUEUE_MESSAGE_WITH_PRIORITY, {
  content: dequeueMessageFromPriorityQueue,
});
scriptsMap.set(ELuaScriptName.REQUEUE_ACKNOWLEDGED_MESSAGE, {
  content: requeueMessage,
});
scriptsMap.set(ELuaScriptName.REQUEUE_DEAD_LETTER_MESSAGE, {
  content: requeueMessage,
});
scriptsMap.set(ELuaScriptName.REQUEUE_ACKNOWLEDGED_MESSAGE_WITH_PRIORITY, {
  content: requeueMessage,
});
scriptsMap.set(ELuaScriptName.REQUEUE_DEAD_LETTER_MESSAGE_WITH_PRIORITY, {
  content: requeueMessage,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_MESSAGE, {
  content: enqueueMessageScript,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_MESSAGE_WITH_PRIORITY, {
  content: enqueueMessageScript,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_SCHEDULED_MESSAGE, {
  content: enqueueScheduledMessageScript,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_SCHEDULED_MESSAGE_WITH_PRIORITY, {
  content: enqueueScheduledMessageScript,
});
scriptsMap.set(ELuaScriptName.SCHEDULE_MESSAGE, {
  content: scheduleMessageScript,
});
scriptsMap.set(ELuaScriptName.ACKNOWLEDGE_MESSAGE, {
  content: acknowledgeMessageScript,
});
scriptsMap.set(ELuaScriptName.DEAD_LETTER_UNACKNOWLEDGED_MESSAGE, {
  content: deadLetterUnacknowledgedMessageScript,
});
scriptsMap.set(ELuaScriptName.REQUEUE_UNACKNOWLEDGED_MESSAGE, {
  content: requeueUnacknowledgedMessageScript,
});
scriptsMap.set(ELuaScriptName.SCHEDULE_UNACKNOWLEDGED_MESSAGE, {
  content: scheduleUnacknowledgedMessageScript,
});

///

export const loadScripts = (
  redisClient: RedisClient,
  cb: ICallback<void>,
): void => {
  const tasks: ((cb: ICallback<void>) => void)[] = [];
  scriptsMap.forEach((script) =>
    tasks.push((cb: ICallback<void>) =>
      redisClient.loadScript(script.content, (err, sha) => {
        if (err) cb(err);
        else if (!sha) cb(new Error('Expected a string value'));
        else {
          script.id = sha;
          cb();
        }
      }),
    ),
  );
  async.waterfall(tasks, cb);
};

///

export const getScriptId = (name: ELuaScriptName): string => {
  const { id } = scriptsMap.get(name) ?? {};
  if (!id) {
    throw new Error(`ID of script [${name}] is missing`);
  }
  return id;
};
