import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import pgConfig from './config/pg.config';

import SetContextIdGlobalMiddleware from './middlewares/context-id.middleware';

import ClothesModule from './modules/clothes/clothes.module';
import CollectionsModule from './modules/collections/collections.module';
import FilesModule from './modules/files/files.module';
import KeycloakModule from './modules/keycloak/keycloak.module';
import LoggerModule from './modules/logger/logger.module';
import OrdersModule from './modules/orders/orders.module';
import PostgresModule from './modules/postgres/postgres.module';
import UsersRegistrationModule from './modules/users/users.registration.module';

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
    UsersRegistrationModule,
  ],
})
export default class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetContextIdGlobalMiddleware).forRoutes('*');
  }
}
