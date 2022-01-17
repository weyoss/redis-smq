import * as fs from 'fs';
import { ICallback } from '../../../../types';
import * as async from 'async';
import { RedisClient } from './redis-client';
import { EmptyCallbackReplyError } from '../errors/empty-callback-reply.error';
import { RedisClientError } from './redis-client.error';

export enum ELuaScriptName {
  ZPOPRPUSH,
  LPOPRPUSH,
  ZPOPHGETRPUSH,
  ZPUSHHSET,
  ENQUEUE_SCHEDULED_MESSAGE,
}

////

const scriptsMap = new Map<ELuaScriptName, { id?: string; content: string }>();
scriptsMap.set(ELuaScriptName.ZPOPRPUSH, {
  content: fs.readFileSync(`${__dirname}/lua/zpoprpush.lua`).toString(),
});
scriptsMap.set(ELuaScriptName.ZPOPHGETRPUSH, {
  content: fs.readFileSync(`${__dirname}/lua/zpophgetrpush.lua`).toString(),
});
scriptsMap.set(ELuaScriptName.ZPUSHHSET, {
  content: fs.readFileSync(`${__dirname}/lua/zpushhset.lua`).toString(),
});
scriptsMap.set(ELuaScriptName.LPOPRPUSH, {
  content: fs.readFileSync(`${__dirname}/lua/lpoprpush.lua`).toString(),
});
scriptsMap.set(ELuaScriptName.ENQUEUE_SCHEDULED_MESSAGE, {
  content: fs
    .readFileSync(`${__dirname}/lua/enqueue-scheduled-message.lua`)
    .toString(),
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
        else if (!sha) cb(new EmptyCallbackReplyError());
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
    throw new RedisClientError(`ID of script [${name}] is missing`);
  }
  return id;
};
