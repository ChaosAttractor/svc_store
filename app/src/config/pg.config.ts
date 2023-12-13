import { PoolConfig } from 'pg';

export default {
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  port: +process.env.POSTGRES_PORT,
  password: process.env.POSTGRES_PASSWORD,
  min: +process.env.POSTGRES_POOL_MIN || 5,
  max: +process.env.POSTGRES_POOL_MAX || 5,
  statement_timeout: +process.env.POSTGRES_STATEMENT_TIMEOUT || 60000,
  database: process.env.POSTGRES_DB,
} as PoolConfig;
