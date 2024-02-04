import { QueryReply } from '@redis/graph/dist/commands/QUERY';

export type QueryParam = null | string | number | boolean | any | Array<QueryParam>;

export interface QueryParams {
  [key: string]: QueryParam;
}

export interface QueryOptions {
  params?: QueryParams;
  TIMEOUT?: number;
}
export type RedisCommandArgument = string | Buffer;

export type GraphReply<T> = Omit<QueryReply, 'headers' | 'data'> & {
  data?: Array<T>;
}
