import { Module } from '@nestjs/common';
import KeycloakAdminService from './keycloak.admin.service';
import KeycloakApiService from './keycloak.api.service';

@Module({
  providers: [KeycloakAdminService, KeycloakApiService],
  exports: [KeycloakAdminService, KeycloakApiService],
})
export default class KeycloakModule {}
