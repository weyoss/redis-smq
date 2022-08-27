import { isMatch } from 'lodash';

export const isEqual = (a: unknown[], b: unknown[]) =>
  isMatch([a], [b]) && isMatch([b], [a]);
