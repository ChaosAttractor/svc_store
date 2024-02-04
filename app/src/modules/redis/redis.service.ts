import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

import * as redis from 'redis';
import { Graph } from 'redis';

import { delayPromise } from '../../utils/delayPromise';

import {
 GraphReply, QueryParam, QueryParams, RedisCommandArgument,
} from './dto/redis.dto';
import { CustomLogger } from '../logger/custom.logger';
import { RedisOptionsInterface } from './interfaces/redis.interfaces';
import { REDIS_OPTIONS } from './const/redis';

@Injectable()
export default class RedisService extends HealthIndicator implements OnModuleInit {
  private redisOptions: RedisOptionsInterface;

  private readonly client;

  private readonly options;

  private connected;

  private readonly queryTimeout;

  private reconnectPeriod;

  constructor(
    @Inject(REDIS_OPTIONS) private cfg: RedisOptionsInterface,
    private logger: CustomLogger,
  ) {
    super();
    this.redisOptions = cfg;
    this.connected = false;
    this.options = {
      password: this.redisOptions.password,
      socket: {
        host: this.redisOptions.host,
        port: +this.redisOptions.port,
        reconnectStrategy: (attempts) => {
          this.logger.log(`Redis reconnecting attempt ${attempts}`, RedisService.name);
          this.connected = false;
          return +this.redisOptions.reconnectPeriod;
        },
      },
    };
    this.reconnectPeriod = Number(this.redisOptions.reconnectPeriod);
    this.client = redis.createClient(this.options);
    this.client.on('connect', () => this.logger.log('Redis connection established', RedisService.name));
    this.client.on('error', async (e) => {
      this.connected = false;
      this.logger.error(`Redis error:: ${e}`);
    });
    this.client.on('reconnecting', () => this.logger.log('Redis reconnecting', RedisService.name));
    this.client.on('ready', () => {
      this.connected = true;
      this.logger.log('Redis ready');
    });
    this.queryTimeout = this.redisOptions.queryTimeout || 60000;
  }

  async onModuleInit(): Promise<void> {
    await this.redisConnection();
  }

  async healthCheck(key: string): Promise<HealthIndicatorResult> {
    if (!this.connected) {
      throw new HealthCheckError('Redis ping error', this.getStatus(key, false));
    }
    const health = await this.client.ping();
    if (health) {
      return this.getStatus(key, true);
    }
    throw new HealthCheckError('Redis ping error', this.getStatus(key, false));
  }

  async redisConnection(): Promise<void> {
    try {
      await this.client.connect();
      this.connected = true;
    } catch (e) {
      this.logger.error('Redis client connect error:: ', RedisService.name, { error: e });
      await delayPromise(this.reconnectPeriod);
      await this.redisConnection();
    }
  }

  async setJsonItems(key: string, data: any): Promise<void> {
    await this.client.json.set(key, '.', data);
  }

  async getJsonItem(key: string): Promise<any> {
    return this.client.json.get(key);
  }

  async dropJsonItem(key: string): Promise<void> {
    await this.client.del(key);
  }

  async setToSet(key: string, value: any): Promise<any> {
    return this.client.sAdd(key, value);
  }

  createGraph(name: string): Graph {
    return new redis.Graph(this.client, name);
  }

  async graphQuery(graph: Graph, query: RedisCommandArgument, params?: QueryParam): Promise<GraphReply<unknown>> {
    const options: QueryParams = {
      params,
      TIMEOUT: this.queryTimeout,
    };
    return graph.query(query, options);
  }

  async graphRoQuery(graph: Graph, query: RedisCommandArgument, params?: QueryParam): Promise<GraphReply<unknown>> {
    const options: QueryParams = {
      params,
      TIMEOUT: this.queryTimeout,
    };
    return graph.roQuery(query, options);
  }
}
