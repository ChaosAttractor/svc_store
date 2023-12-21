import { Module } from '@nestjs/common';

import pgConfig from './config/pg.config';

import ClothesModule from './modules/clothes/clothes.module';
import CollectionsModule from './modules/collections/collections.module';
import FilesModule from './modules/files/files.module';
import OrdersModule from './modules/orders/orders.module';
import PostgresModule from './modules/postgres/postgres.module';

@Module({
  imports: [
    PostgresModule.forRoot(pgConfig),
    FilesModule,
    CollectionsModule,
    ClothesModule,
    OrdersModule,
  ],
})
export class AppModule {}
