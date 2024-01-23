import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HealthCheckError, HealthIndicatorResult } from '@nestjs/terminus';
import { HealthIndicatorStatus } from '@nestjs/terminus/dist/health-indicator/health-indicator-result.interface';

import { Pool, PoolClient, PoolConfig } from 'pg';

import { DATABASE_CONFIG } from '../../const/tokens';
import { delayPromise } from '../../utils/delayPromise';
import { CustomLogger } from '../logger/custom.logger';

/**
 * Сервис для управления базой данных postgres
 *
 */
@Injectable()
export default class PostgresService implements OnModuleDestroy, OnModuleInit {
  private pool: Pool;

  private intervalConnectCheck;

  constructor(
    @Inject(DATABASE_CONFIG) private config: PoolConfig,
    private logger: CustomLogger,
  ) {
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

  async healthcheck(key: string): Promise<HealthIndicatorResult> {
    const result: HealthIndicatorResult = {
      [key]: {
        status: 'up' as HealthIndicatorStatus,
        message: undefined,
      },
    };
    try {
      await this.pool.query('SELECT 1+1');
      return result;
    } catch (e) {
      result[key].status = 'down';
      result[key].message = e?.response?.data || e?.message || 'unknown';
      throw new HealthCheckError('TMS healthcheck error', result);
    }
  }

  async checkConnect(recurse = false): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1+1');
      this.logger.log('Database info', PostgresService.name, {
        host: this.config.host,
        user: this.config.user,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount,
        total: this.pool.totalCount,
        max: this.config.max,
      });
      return true;
    } catch (error) {
      this.logger.error('Database connection error', PostgresService.name, {
        error,
      });
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
      console.error('ERROR SQL::', sql);
      console.error('ERROR PARAMS::', params);
      console.error('ERROR QUERY EXEC::', error);
      this.logger.error('Error on query execute', PostgresService.name, {
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
      console.error('ERROR TRANSACTION EXEC::', error);
      await client.query('ROLLBACK');
      this.logger.error('Error on transaction execute', PostgresService.name, {
        error,
      });
      throw new Error('Database error');
    } finally {
      client.release();
    }
  }
}
