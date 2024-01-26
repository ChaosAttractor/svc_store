import { BadRequestException, Injectable } from '@nestjs/common';

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

  async create(dto: UsersRegistrationDto, contextId = '') {
    this.logger.log('Создание пользователя', UsersRegistrationService.name, {}, contextId);
    const {
      username,
      firstName,
      lastName,
      email,
      emailVerified,
      enabled,
      password,
    } = dto;

    const [data] = await this.postgresService.query(`
      SELECT * FROM users WHERE email = $1
    `, [email]);

    /** Проверка на существование пользователя, если он есть, то выкидываем */
    if (data) {
      throw new BadRequestException({
        message: 'email already exists',
      });
    }

    /**
     * todo
     *  1. ui со списком почт
     *  2. подтверждение пароля через nodemailer, каждые несколько запросов свапать
     *  иначе получим бан на отправку писем, 500 писем в день можно
     */
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
    const { id } = await this.keycloakAdminService.createUsers({
      username,
      enabled,
      credentials,
      firstName,
      lastName,
      email,
      emailVerified,
      groups: [],
      realm,
    });
    await this.postgresService.query(`
      INSERT INTO users
        (id, keycloak_id, first_name, last_name, username, email, email_verified, enabled, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now())
    `, [id, firstName, lastName, username, email, emailVerified, enabled]);
    return {
      messages: 'success',
    };
  }
}
