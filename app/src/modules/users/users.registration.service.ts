import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { Injectable } from '@nestjs/common';

import KeycloakAdminService from '../keycloak/keycloak.admin.service';
import { CustomLogger } from '../logger/custom.logger';
import PostgresService from '../postgres/postgres.service';

@Injectable()
export default class UsersRegistrationService {
  constructor(
    private keycloakAdminService: KeycloakAdminService,
    private postgresService: PostgresService,
    private logger: CustomLogger,
  ) {}

  async create(payload: UserRepresentation) {
    return this.keycloakAdminService.createUsers({ ...payload, realm: process.env.KEYCLOAK_REALM });
  }
}
