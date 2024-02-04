export interface RedisOptionsInterface {
  password: string;
  host: string;
  port: string;
  reconnectPeriod: string;
  queryTimeout?: number;
}
