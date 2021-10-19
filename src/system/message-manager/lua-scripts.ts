import * as fs from 'fs';
import { ICallback } from '../../../types';
import * as async from 'async';
import { RedisClient } from '../redis-client';

export enum ELuaScriptName {
  DEQUEUE_MESSAGE_WITH_PRIORITY,
  DELETE_MESSAGE_FROM_SORTED_SET,
  DELETE_MESSAGE_FROM_LIST,
  ENQUEUE_MESSAGE_FROM_ACKNOWLEDGED,
  ENQUEUE_MESSAGE_FROM_DL,
  ENQUEUE_MESSAGE_FROM_SCHEDULED,
  ENQUEUE_WITH_PRIORITY_MESSAGE_FROM_ACKNOWLEDGED,
  ENQUEUE_WITH_PRIORITY_MESSAGE_FROM_DL,
  ENQUEUE_WITH_PRIORITY_MESSAGE_FROM_SCHEDULED,
}

///

const deleteFromListScript = fs
  .readFileSync(`${__dirname}/lua/delete-from-list.lua`)
  .toString();
const deleteFromSortedSetScript = fs
  .readFileSync(`${__dirname}/lua/delete-from-sorted-set.lua`)
  .toString();
const dequeueFromSortedSet = fs
  .readFileSync(`${__dirname}/lua/dequeue-from-sorted-set.lua`)
  .toString();
const moveFromSortedSetToList = fs
  .readFileSync(`${__dirname}/lua/move-from-sorted-set-to-list.lua`)
  .toString();
const moveFromSortedSetToSortedSet = fs
  .readFileSync(`${__dirname}/lua/move-from-sorted-set-to-sorted-set.lua`)
  .toString();

////

const scriptsMap = new Map<ELuaScriptName, { id?: string; content: string }>();
scriptsMap.set(ELuaScriptName.DELETE_MESSAGE_FROM_LIST, {
  content: deleteFromListScript,
});
scriptsMap.set(ELuaScriptName.DELETE_MESSAGE_FROM_SORTED_SET, {
  content: deleteFromSortedSetScript,
});
scriptsMap.set(ELuaScriptName.DEQUEUE_MESSAGE_WITH_PRIORITY, {
  content: dequeueFromSortedSet,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_MESSAGE_FROM_ACKNOWLEDGED, {
  content: moveFromSortedSetToList,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_MESSAGE_FROM_DL, {
  content: moveFromSortedSetToList,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_MESSAGE_FROM_SCHEDULED, {
  content: moveFromSortedSetToList,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_WITH_PRIORITY_MESSAGE_FROM_ACKNOWLEDGED, {
  content: moveFromSortedSetToSortedSet,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_WITH_PRIORITY_MESSAGE_FROM_DL, {
  content: moveFromSortedSetToSortedSet,
});
scriptsMap.set(ELuaScriptName.ENQUEUE_WITH_PRIORITY_MESSAGE_FROM_SCHEDULED, {
  content: moveFromSortedSetToSortedSet,
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
    throw new Error(`ID of script [${name}] is required`);
  }
  return id;
};
