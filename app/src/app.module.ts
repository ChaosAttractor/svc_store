import {
 MiddlewareConsumer, Module, NestModule, RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';

import { JwtModule } from '@nestjs/jwt';

import pgConfig from './config/pg.config';
import redisConfig from './config/redis.config';

import { REFLECTOR_FIX } from './const/logger';

import LoggingInterceptor from './modules/logger/logger.interceptor';

import { MethodsGuard } from './guard/methods.guard';

import SetContextIdGlobalMiddleware from './middlewares/context-id.middleware';
import CheckTokensGlobalMiddleware from './middlewares/check-tokens.global.middleware';

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
import UserProfileModule from './modules/user_profile/user.profile.module';
import DeliveryModule from './modules/delivery/delivery.module';

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
    UserProfileModule,
    DeliveryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: MethodsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: REFLECTOR_FIX,
      useClass: Reflector,
    },

  ],
})
export default class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetContextIdGlobalMiddleware).forRoutes('*')
      .apply(CheckTokensGlobalMiddleware).exclude(
     { path: '/auth/login', method: RequestMethod.ALL },
      { path: '/auth/statusToken', method: RequestMethod.ALL },
      { path: '/auth/status', method: RequestMethod.ALL },
      { path: '/registration/(.*)', method: RequestMethod.ALL },
      )
    .forRoutes('*');
  }
}
