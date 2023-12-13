import PostgresModule from './modules/postgres/postgres.module';
import { Module } from '@nestjs/common';
import FilesModule from './modules/files/files.module';
import pgConfig from './config/pg.config';

@Module({
  imports: [PostgresModule.forRoot(pgConfig), FilesModule],
})
export class AppModule {}
