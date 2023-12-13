import { Module } from '@nestjs/common';

import pgConfig from './config/pg.config';
import FilesModule from './modules/files/files.module';
import PostgresModule from './modules/postgres/postgres.module';

@Module({
  imports: [PostgresModule.forRoot(pgConfig), FilesModule],
})
export class AppModule {}
