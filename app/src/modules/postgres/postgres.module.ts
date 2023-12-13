import { Global, Module } from '@nestjs/common';
import { PoolConfig } from 'pg';

import PostgresService from './postgres.service';

import { DATABASE_CONFIG } from '../../const/tokens';

@Global()
@Module({})
export default class PostgresModule {
  static forRoot(pgConfig: PoolConfig) {
    return {
      module: PostgresModule,
      exports: [PostgresService],
      providers: [
        {
          useValue: pgConfig,
          provide: DATABASE_CONFIG,
        },
        PostgresService,
      ],
    };
  }
}
