const redisConfig = {
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  reconnectPeriod: process.env.REDIS_RECONNECT_PERIOD,
  queryTimeout: +process.env.REDIS_QUERY_TIMEOUT || 60000,
};

export default redisConfig;
