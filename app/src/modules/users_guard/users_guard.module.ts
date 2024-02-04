import { Module } from '@nestjs/common';
import UsersGuardService from './users_guard.service';
import KeycloakModule from '../keycloak/keycloak.module';

@Module({
  imports: [KeycloakModule],
  providers: [UsersGuardService],
  exports: [UsersGuardService],
})
export default class UsersGuardModule {}
