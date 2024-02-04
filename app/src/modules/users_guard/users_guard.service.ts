import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../logger/custom.logger';
import UsersGetMethodsInterface, {
  RoleArray,
  SetString,
} from '../../interfaces/users.get.methods.interface';
import KeycloakAdminService from '../keycloak/keycloak.admin.service';
import { RightsInfoInterface } from '../../interfaces/rights.info.interface';

const briefRepresentation = false;
@Injectable()
export default class UsersGuardService {
  constructor(
    private logger: CustomLogger,
    private keycloakAdminService: KeycloakAdminService,
  ) { }

  /**
   * Получение всех методов и ролей пользователя
   * @private
   * @param keycloakId
   * @param ip
   * @param contextId
   */
  async getUserRolesData(
    ip: string,
    keycloakId: string,
    contextId: string,
  ): Promise<RightsInfoInterface> {
    const { roles } = await this.checkRolesAvailable(ip, keycloakId, contextId);

    // убираем из ролей allowIps, составляем список организационных ролей пользователя
    const returnedRoles = roles.map(({ methodSet, id }) => ({ methodSet, id }));

    return {
      roles: returnedRoles,
    };
  }

  /**
   * Проверка прав доступа к ролям по IP
   * @param ip
   * @param keycloakId
   * @param contextId
   */
  async checkRolesAvailable(
    ip: string,
    keycloakId: string,
    contextId: string,
  ): Promise<UsersGetMethodsInterface> {
    this.logger.log('Получение доступных ролей пользователя', UsersGuardService.name, { ip, keycloakId }, contextId);
    const { allMethods, roles } = await this.getUserMethodAndRoles(keycloakId);

    return {
      allMethods,
      roles,
    };
  }

  /**
   * Получение методов и ролей пользователя из кейклок
   * Возвращает все методы и роли пользователя
   * Роли содержат информацию о содержащихся методах и ограничении по IP
   * @private
   * @param keycloakId
   */
  private async getUserMethodAndRoles(keycloakId: string): Promise<UsersGetMethodsInterface> {
    const data = await this.keycloakAdminService.getUserRoles({
      id: keycloakId,
      representation: briefRepresentation,
    });

    const allMethods = new Set() as SetString;

    const roles = data.map(({ realmRoles = [], id }) => {
      realmRoles.forEach((method) => allMethods.add(method));
      return {
        id,
        methodSet: new Set(realmRoles),
      };
    }) as RoleArray;

    return {
      allMethods,
      roles,
    };
  }
}
