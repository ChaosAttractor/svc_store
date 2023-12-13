import { Module } from '@nestjs/common';
import PostgresModule from './modules/postgres/postgres.module';
import pgConfig from './config/pg.config';

@Module({
  imports: [
    PostgresModule.forRoot(pgConfig)
  ],
})
export class AppModule {}
