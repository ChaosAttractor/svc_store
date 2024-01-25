import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import CredentialRepresentation from '@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import RoleRepresentation, {
  RoleMappingPayload,
} from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import UserSessionRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userSessionRepresentation';
import { RoleQuery } from '@keycloak/keycloak-admin-client/lib/resources/roles';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import jwtDecode from 'jwt-decode';
import * as moment from 'moment';

import RoleCreateDto from './dto/role.create.dto';
import RolesGetFormatRolesResponseDto from './dto/roles.getFormatRoles.response.dto';
import UsersFindDto from './dto/users.find.dto';
import { KEYCLOAK_GRAND_TYPE } from '../../const/keycloakParams';
import { delayPromise } from '../../utils/delayPromise';
import { CustomLogger } from '../logger/custom.logger';

const realm = process.env.KEYCLOAK_REALM;
const briefRepresentation = false;

/**
 * Сервис для работы с keycloak
 */
@Injectable()
export default class KeycloakAdminService implements OnApplicationBootstrap {
  keycloakAdminClient: KeycloakAdminClient;

  private readonly keycloakAdminClientCredentials: Credentials;

  private readonly keycloakReconnectPeriod: number;

  constructor(private logger: CustomLogger) {
    this.keycloakAdminClient = new KeycloakAdminClient({
      baseUrl: process.env.KEYCLOAK_URL,
      realmName: process.env.KEYCLOAK_REALM,
      requestConfig: {
        timeout: +process.env.KEYCLOAK_REQUEST_TIMEOUT || 10000,
      },
    });

    this.keycloakAdminClientCredentials = {
      grantType: KEYCLOAK_GRAND_TYPE,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    };

    this.keycloakReconnectPeriod = +process.env.KEYCLOAK_RECONNECT_PERIOD || 5000;
  }

  async onApplicationBootstrap() {
    await this.connect();
  }

  /**
   * Проверка и обновление токена
   */
  async checkToken(): Promise<void> {
    try {
      const accessToken = await this.getClientAccessToken();
      if (!accessToken) {
        await this.connect();
        return;
      }
      const tokenExpires = jwtDecode(accessToken)['exp'];
      if (moment(Number(tokenExpires) * 1000) <= moment().add(10, 'seconds')) {
        await this.connect();
      }
    } catch (e) {
      this.logger.error('Keycloak admin client connect error', KeycloakAdminService.name);
    }
  }

  /**
   * Keycloak connect
   */
  async connect(): Promise<void> {
    try {
      this.logger.log('Keycloak admin client connect', KeycloakAdminService.name);
      await this.keycloakAdminClient.auth(this.keycloakAdminClientCredentials);
      this.logger.log('Keycloak admin client connect success', KeycloakAdminService.name);
    } catch (e) {
      const data = e.response ? e.response.data : e.data;
      const message = e.response ? e.response.message : e.message;
      const error = { data, message };
      this.logger.error('Keycloak admin client connect error', KeycloakAdminService.name, {
        error,
      });
      await delayPromise(this.keycloakReconnectPeriod);
      this.logger.warn('Keycloak admin client reconnect', KeycloakAdminService.name);
      await this.connect();
    }
  }

  /**
   * Получение access токена подключения для его проверки в middleware
   */
  async getClientAccessToken(): Promise<string> {
    return this.keycloakAdminClient.accessToken;
  }

  /**
   * Получение авторизационного токена приложения
   */
  async getAuthorizationToken(): Promise<string> {
    await this.checkToken();
    return this.getClientAccessToken();
  }

  /**
   * Auth
   */

  /**
   * Logout пользователя из всех сессий
   * @param id - id пользователя
   */
  async usersLogout(id: string): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.users.logout({ realm, id });
  }

  /**
   * Завершение сессии
   * @param session - сессия
   */
  async realmsRemoveSession(session: string): Promise<void> {
    const payload = {
      realm,
      session,
    } as any;
    await this.checkToken();
    return this.keycloakAdminClient.realms.removeSession(payload);
  }

  /**
   * Получение сессий пользователя
   * @param id - id пользователя
   */
  async getUserSessions(id: string): Promise<UserSessionRepresentation[]> {
    await this.checkToken();
    return this.keycloakAdminClient.users.listSessions({ realm, id });
  }

  /**
   * Clients
   */

  /**
   * Получение списка клиентов
   */
  async findClients(): Promise<ClientRepresentation[]> {
    await this.checkToken();
    return this.keycloakAdminClient.clients.find({ realm });
  }

  /**
   * Roles
   */

  /**
   * Поиск методов
   */
  async findMethods(): Promise<RoleRepresentation[]> {
    await this.checkToken();
    return this.keycloakAdminClient.roles.find({ realm, briefRepresentation } as RoleQuery);
  }

  /**
   * Поиск метода по имени
   */
  async findMethodsByName(name: string): Promise<RoleRepresentation> {
    await this.checkToken();
    return this.keycloakAdminClient.roles.findOneByName({ name, realm });
  }

  /**
   * Удаление метода по id
   * @param id - id метода
   */
  async deleteMethod(id: string): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.roles.delById({ id, realm });
  }

  /**
   * Создание метода
   * @param name - Название метода
   * @param description - описание метода
   * @param type - тип роли (системная/организационная)
   */
  async createMethod(
    name: string,
    description: string,
    type: string,
  ): Promise<{ roleName: string }> {
    await this.checkToken();
    return this.keycloakAdminClient.roles.create({
      realm,
      name,
      description,
      attributes: {
        type: [type],
      },
    });
  }

  /**
   * Удаление метода
   * @param name - Название метода
   */
  async deleteMethodByName(name: string): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.roles.delByName({ name, realm });
  }

  /**
   * Обновление метода по названию
   */
  async updateMethodByName(name: string, type: string): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.roles.updateByName(
      {
        name,
        realm,
      },
      {
        attributes: {
          type: [type],
        },
      },
    );
  }

  /**
   * Поиск роли
   * @param search - название роли
   * @param representation - краткое представление
   */
  async findRoles({
    search,
    representation = true,
  }: {
    search?: string;
    representation?: boolean;
  }): Promise<GroupRepresentation[]> {
    await this.checkToken();
    return this.keycloakAdminClient.groups.find({
      search,
      realm,
      briefRepresentation: representation,
    });
  }

  /**
   * Получение роли
   * @param id - id роли
   * @param representation - краткое представление
   */
  async getRole(id: string, representation = true): Promise<GroupRepresentation> {
    await this.checkToken();
    return this.keycloakAdminClient.groups.findOne({
      id,
      realm,
      briefRepresentation: representation,
    } as { id: string; realm: string });
  }

  /**
   * Создание роли
   * @param dto
   */
  async createRole(dto: RoleCreateDto): Promise<{ id: string }> {
    await this.checkToken();
    return this.keycloakAdminClient.groups.create({
      ...dto,
      realm,
    });
  }

  /**
   * Обновление роли
   * @param id - id роли
   * @param dto
   */
  async updateRole(id: string, dto: GroupRepresentation): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.groups.update(
      {
        id,
        realm,
      },
      dto,
    );
  }

  /**
   * Получение методов у роли
   * @param id - id группы
   */
  async rolesListRealmMethodsMappings(id: string): Promise<RoleRepresentation[]> {
    await this.checkToken();
    return this.keycloakAdminClient.groups.listRealmRoleMappings({
      realm,
      id,
    });
  }

  /**
   * Добавление метода к роли
   * @param id
   * @param roles
   */
  async rolesAddRealmMethodMappings(id: string, roles: RoleMappingPayload[]): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.groups.addRealmRoleMappings({
      realm,
      id,
      roles,
    });
  }

  /**
   * Удаление метода из роли
   * @param id - id роли
   * @param roles - роли для удаления
   */
  async rolesDelRealmMethodMappings(id: string, roles: RoleMappingPayload[]): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.groups.delRealmRoleMappings({
      realm,
      id,
      roles,
    });
  }

  /**
   * Удаление роли
   * @param id - id роли
   */
  async delRole(id: string): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.groups.del({ realm, id });
  }

  /**
   * Получение списка пользователей с ролью
   * @param id - id группы
   */
  async getRoleMembers(id: string): Promise<UserRepresentation[]> {
    await this.checkToken();
    return this.keycloakAdminClient.groups.listMembers({ realm, id });
  }

  /**
   * Получение количества пользователей с заданной ролью
   * @private
   * @param role
   */
  private async getRoleMembersCount(role: RolesGetFormatRolesResponseDto) {
    const members = await this.keycloakAdminClient.groups.listMembers({ realm, id: role.roleId });
    const membersCount = members.filter((user) => !!user.enabled).length;
    return {
      ...role,
      membersCount,
    };
  }

  /**
   * Users
   */

  /**
   * Получение списка методов пользователя
   * @param id - id пользователя
   */
  async getUsersMethods(id: string): Promise<RoleRepresentation[]> {
    await this.checkToken();
    return this.keycloakAdminClient.users.listCompositeRealmRoleMappings({
      realm,
      id,
      briefRepresentation,
    } as { id: string; realm: string });
  }

  /**
   * Получение списка ролей пользователя
   * @param id - id пользователя
   * @param representation - краткое представление
   */
  async getUserRoles({
    id,
    representation = true,
  }: {
    id: string;
    representation?: boolean;
  }): Promise<GroupRepresentation[]> {
    await this.checkToken();
    return this.keycloakAdminClient.users.listGroups({
      id,
      realm,
      briefRepresentation: representation,
    });
  }

  /**
   * Поиск пользователей
   * @param dto
   */
  async findUsers(dto: UsersFindDto): Promise<UserRepresentation[]> {
    await this.checkToken();
    return this.keycloakAdminClient.users.find({ ...dto, realm });
  }

  /**
   * Создание пользователя
   * @param payload
   */
  async createUsers(payload: UserRepresentation & { realm: string }): Promise<{ id: string }> {
    await this.checkToken();
    return this.keycloakAdminClient.users.create(payload);
  }

  /**
   * Получение пользователя по id
   * @param id - id пользователя
   */
  async getUser(id: string): Promise<UserRepresentation> {
    await this.checkToken();
    return this.keycloakAdminClient.users.findOne({
      id,
      realm,
    });
  }

  /**
   * Обновление пользователя
   * @param id - id пользователя
   * @param payload
   */
  async updateUser(id: string, payload: UserRepresentation): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.users.update(
      {
        realm,
        id,
      },
      payload,
    );
  }

  /**
   * Добавление роли пользователю
   * @param userId - id пользователя
   * @param roleId - id роли
   */
  async addUserToRole(userId: string, roleId: string): Promise<string> {
    await this.checkToken();
    return this.keycloakAdminClient.users.addToGroup({
      realm,
      groupId: roleId,
      id: userId,
    });
  }

  /**
   * Удаление роли пользователя
   * @param userId - id пользователя
   * @param roleId - id группы
   */
  async deleteUserFromRole(userId: string, roleId: string) {
    await this.checkToken();
    return this.keycloakAdminClient.users.delFromGroup({
      realm,
      groupId: roleId,
      id: userId,
    });
  }

  /**
   * Обновление пароля пользователя
   * @param id - id пользователя
   * @param credential - пароль
   */
  async resetUserPassword(id: string, credential: CredentialRepresentation): Promise<void> {
    await this.checkToken();
    return this.keycloakAdminClient.users.resetPassword({
      realm,
      id,
      credential,
    });
  }
}
