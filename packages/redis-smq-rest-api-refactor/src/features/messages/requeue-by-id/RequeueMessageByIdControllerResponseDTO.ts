import type { TErrors } from '../../../errors/index.js';

export type RequeueMessageByIdControllerResponseDTO =
  | readonly [204, null]
  | TErrors['MessageNotFoundError']
  | TErrors['MessageNotRequeuableError']
  | TErrors['RequeueMessageScriptError']
  | TErrors['UnexpectedScriptReplyError'];
