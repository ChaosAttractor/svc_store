import { Module } from '@nestjs/common';

import pgConfig from './config/pg.config';

import FilesModule from './modules/files/files.module';
import PostgresModule from './modules/postgres/postgres.module';
import CollectionsModule from './modules/collections/collections.module';

@Module({
  imports: [PostgresModule.forRoot(pgConfig), FilesModule, CollectionsModule],
})
export class AppModule {}
