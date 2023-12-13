import { Module } from '@nestjs/common';

import pgConfig from './config/pg.config';

import FilesModule from './modules/files/files.module';
import PostgresModule from './modules/postgres/postgres.module';
import CollectionsModule from './modules/collections/collections.module';
import ClothesModule from './modules/clothes/clothes.module';
import OrdersModule from './modules/orders/orders.module';

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
