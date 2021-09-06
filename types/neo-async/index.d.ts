declare module 'neo-async' {
  import { TFunction } from '../index';

  export interface Dictionary<T> {
    [key: string]: T;
  }
  export type IterableCollection<T> = T[] | IterableIterator<T> | Dictionary<T>;

  export interface ErrorCallback<E = Error> {
    (err?: E | null): void;
  }

  export interface AsyncResultCallback<T, E = Error> {
    (err?: E | null, result?: T): void;
  }
  export interface AsyncResultArrayCallback<T, E = Error> {
    (err?: E | null, results?: Array<T | undefined>): void;
  }
  export interface AsyncResultObjectCallback<T, E = Error> {
    (err: E | undefined, results: Dictionary<T | undefined>): void;
  }

  export interface AsyncFunction<T, E = Error> {
    (callback: (err?: E | null, result?: T) => void): void;
  }

  export interface AsyncIterator<T, E = Error> {
    (item: T, key: number | string, callback: ErrorCallback<E>): void;
  }

  export function each<T, E = Error>(
    arr: IterableCollection<T>,
    iterator: AsyncIterator<T, E>,
    callback: ErrorCallback<E>,
  ): void;

  export function each<T, E = Error>(
    arr: IterableCollection<T>,
    iterator: AsyncIterator<T, E>,
  ): Promise<void>;

  export function parallel<T, E = Error>(
    tasks: Array<AsyncFunction<T, E>>,
    callback?: AsyncResultArrayCallback<T, E>,
  ): void;

  export function parallel<T, E = Error>(
    tasks: Dictionary<AsyncFunction<T, E>>,
    callback?: AsyncResultObjectCallback<T, E>,
  ): void;

  export function parallel<T, R, E = Error>(
    tasks: Array<AsyncFunction<T, E>> | Dictionary<AsyncFunction<T, E>>,
  ): Promise<R>;

  export function waterfall<T, E = Error>(
    tasks: TFunction[],
    callback?: AsyncResultCallback<T, E>,
  ): void;
}
