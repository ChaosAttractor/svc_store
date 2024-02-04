import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import AuthService from './auth.service';

import AuthController from './auth.controller';

import KeycloakModule from '../keycloak/keycloak.module';
import UsersGuardModule from '../users_guard/users_guard.module';
import TokensModule from '../tokens/tokens.module';

@Module({
  imports: [JwtModule.register({}), KeycloakModule, UsersGuardModule, TokensModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export default class AuthModule {}
