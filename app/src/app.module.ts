import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import pgConfig from './config/pg.config';
import redisConfig from './config/redis.config';

import SetContextIdGlobalMiddleware from './middlewares/context-id.middleware';

import RedisModule from './modules/redis/redis.module';
import AuthModule from './modules/auth/auth.module';
import ClothesModule from './modules/clothes/clothes.module';
import CollectionsModule from './modules/collections/collections.module';
import FilesModule from './modules/files/files.module';
import KeycloakModule from './modules/keycloak/keycloak.module';
import LoggerModule from './modules/logger/logger.module';
import OrdersModule from './modules/orders/orders.module';
import PostgresModule from './modules/postgres/postgres.module';
import UsersRegistrationModule from './modules/users_registration/users.registration.module';
import UsersGuardModule from './modules/users_guard/users_guard.module';
import TokensModule from './modules/tokens/tokens.module';

@Module({
  imports: [
    RedisModule.forRoot(redisConfig),
    PostgresModule.forRoot(pgConfig),
    JwtModule.register({}),
    LoggerModule,
    FilesModule,
    CollectionsModule,
    ClothesModule,
    OrdersModule,
    KeycloakModule,
    LoggerModule,
    UsersRegistrationModule,
    UsersGuardModule,
    AuthModule,
    TokensModule,
  ],
})
export default class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetContextIdGlobalMiddleware).forRoutes('*');
  }
}
