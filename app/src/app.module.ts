import { Module } from '@nestjs/common';

import pgConfig from './config/pg.config';

import ClothesModule from './modules/clothes/clothes.module';
import CollectionsModule from './modules/collections/collections.module';
import FilesModule from './modules/files/files.module';
import KeycloakModule from './modules/keycloak/keycloak.module';
import { LoggerModule } from './modules/logger/logger.module';
import OrdersModule from './modules/orders/orders.module';
import PostgresModule from './modules/postgres/postgres.module';

@Module({
  imports: [
    PostgresModule.forRoot(pgConfig),
    LoggerModule,
    FilesModule,
    CollectionsModule,
    ClothesModule,
    OrdersModule,
    KeycloakModule,
    LoggerModule,
  ],
})
export class AppModule {}
