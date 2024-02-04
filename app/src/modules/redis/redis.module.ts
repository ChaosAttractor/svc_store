import { Global, Module } from '@nestjs/common';

import { RedisOptionsInterface } from './interfaces/redis.interfaces';

import { REDIS_OPTIONS } from './const/redis';

import RedisService from './redis.service';

@Global()
@Module({})
export default class RedisModule {
  static forRoot(cfg: RedisOptionsInterface) {
    return {
      module: RedisModule,
      exports: [RedisService],
      providers: [
        {
          useValue: cfg,
          provide: REDIS_OPTIONS,
        },
        RedisService,
      ],
    };
  }
}
