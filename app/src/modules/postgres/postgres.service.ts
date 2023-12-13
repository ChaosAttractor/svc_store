import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient, PoolConfig } from 'pg';

import { DATABASE_CONFIG } from '../../const/tokens';

const delayPromise = (delay = 3000) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, delay);
  });

/**
 * Сервис для управления базой данных postgres
 */
@Injectable()
export default class PostgresService implements OnModuleDestroy, OnModuleInit {
  private pool: Pool;

  private intervalConnectCheck;

  constructor(@Inject(DATABASE_CONFIG) private config: PoolConfig) {
    this.pool = new Pool(config);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.intervalConnectCheck) {
      clearInterval(this.intervalConnectCheck);
      this.intervalConnectCheck = null;
    }
    await this.pool.end();
  }

  async onModuleInit() {
    this.checkConnect(true)
      .then(() => {
        this.intervalConnectCheck = setInterval(this.checkConnect.bind(this), 15000);
      })
      .catch(() => null);
  }

  async checkConnect(recurse = false): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1+1');
      return true;
    } catch (error) {
      console.error('Database connection error', PostgresService.name, { error });
      if (recurse) {
        await delayPromise(15000);
        return this.checkConnect(recurse);
      }
      return true;
    }
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    try {
      const result = await this.pool.query<T>(sql, params);
      return result.rows || [];
    } catch (error) {
      console.log('ERROR SQL::', sql);
      console.log('ERROR PARAMS::', params);
      console.log('ERROR QUERY EXEC::', error);
      console.error('Error on query execute', PostgresService.name, {
        error,
      });
      throw new Error('Database error');
    }
  }

  async transaction<T>(queryFunction: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await queryFunction(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      console.log('ERROR TRANSACTION EXEC::', error);
      await client.query('ROLLBACK');
      console.error('Error on transaction execute', PostgresService.name, { error });
      throw new Error('Database error');
    } finally {
      client.release();
    }
  }
}
