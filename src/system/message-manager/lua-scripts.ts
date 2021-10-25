import * as fs from 'fs';
import { ICallback } from '../../../types';
import * as async from 'async';
import { RedisClient } from '../redis-client';

export enum ELuaScriptName {
  DEQUEUE_MESSAGE_WITH_PRIORITY,
}

///

const dequeueMessageFromPriorityQueue = fs
  .readFileSync(`${__dirname}/lua/dequeue-message-from-priority-queue.lua`)
  .toString();

////

const scriptsMap = new Map<ELuaScriptName, { id?: string; content: string }>();
scriptsMap.set(ELuaScriptName.DEQUEUE_MESSAGE_WITH_PRIORITY, {
  content: dequeueMessageFromPriorityQueue,
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
