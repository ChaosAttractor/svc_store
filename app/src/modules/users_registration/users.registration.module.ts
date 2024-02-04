import { Module } from '@nestjs/common';
import UsersRegistrationController from './users.registration.controller';
import UsersRegistrationService from './users.registration.service';
import KeycloakModule from '../keycloak/keycloak.module';

@Module({
  imports: [KeycloakModule],
  providers: [UsersRegistrationService],
  controllers: [UsersRegistrationController],
})
export default class UsersRegistrationModule {}
