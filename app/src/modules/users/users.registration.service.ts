import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { Injectable } from '@nestjs/common';

import { UsersRegistrationDto } from './dto/users.registration.dto';
import KeycloakAdminService from '../keycloak/keycloak.admin.service';
import { CustomLogger } from '../logger/custom.logger';
import PostgresService from '../postgres/postgres.service';

const realm = process.env.KEYCLOAK_REALM;

@Injectable()
export default class UsersRegistrationService {
  constructor(
    private keycloakAdminService: KeycloakAdminService,
    private postgresService: PostgresService,
    private logger: CustomLogger,
  ) {}

  async create(dto: UsersRegistrationDto) {
    const { username, firstName, lastName, enabled, password } = dto;

    // todo проверка на сущ. юзера
    // todo выдача группы ролей
    // todo создание ролей из файла при запуске приложения
    // todo повышение безопасности

    const credentials = password
      ? [
          {
            type: 'password',
            value: password,
            temporary: false,
          },
        ]
      : undefined;
    return this.keycloakAdminService.createUsers({
      username,
      enabled,
      credentials,
      firstName,
      lastName,
      groups: [],
      realm,
    });
  }
}
