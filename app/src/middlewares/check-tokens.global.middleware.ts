import {
  Injectable, NestMiddleware, UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as requestIp from 'request-ip';

import jwtDecode from 'jwt-decode';

import AuthService from '../modules/auth/auth.service';

import authMessages from '../modules/auth/const/auth.messages';

import { RightsInfoInterface } from '../interfaces/rights.info.interface';
import UsersGuardService from '../modules/users_guard/users_guard.service';
import { CustomLogger } from '../modules/logger/custom.logger';
import IGetUserInfo from '../interfaces/get-user.info.interface';
import { TokenInterface } from '../modules/auth/interfaces/auth.interfaces';

interface ContextRequestInterface extends Request {
  contextId: string
}

@Injectable()
export default class CheckTokensGlobalMiddleware implements NestMiddleware {
  constructor(
    private authService: AuthService,
    private usersGuardService: UsersGuardService,
    private logger: CustomLogger,
  ) {}

  private async checkTokens(
    req: Request,
    accessToken: string,
    contextId: string,
  ) {
    const { data } = await this.authService.statusToken({ accessToken });

    if (!data.active) {
      this.logger.error('Access Token not active', CheckTokensGlobalMiddleware.name, { data }, contextId);
      throw new Error(authMessages.LOGIN_ERROR);
    }

    const { client_id: clientId, aud, realm_access: realmAccess } = data;

    if (aud === 'account') {
      req['entity'] = 'user';
      return;
    }

    if (!realmAccess) {
      this.logger.error('No client realm access', CheckTokensGlobalMiddleware.name, {}, contextId);
      throw new Error(authMessages.LOGIN_ERROR);
    }

    req['entity'] = 'client';
    req['clientInfo'] = {
      id: clientId,
      methods: realmAccess.roles,
    };
  }

  /**
   * Получение информации о пользователе
   * @param keycloakId
   * @param ip
   * @param userInfoToken
   * @param contextId
   * @private
   */
  private async getUserInfo(
    keycloakId: string,
    ip: string,
    userInfoToken: string,
    contextId: string,
  ): Promise<{
    profileInfo: IGetUserInfo,
    rolesInfo: RightsInfoInterface
  }> {
    if (userInfoToken) {
      return <{profileInfo: IGetUserInfo, rolesInfo: RightsInfoInterface}>jwtDecode(userInfoToken);
    }

    const rolesInfo = await this.usersGuardService.getUserRolesData(ip, keycloakId, contextId);

    return {
      profileInfo: {},
      rolesInfo,
    };
  }

  private async checkUserInfo(req: ContextRequestInterface) {
    const contextId = req.contextId || '';

    const accessToken = req.headers.authorization;

    const userInfoToken = req.headers['x-user'] as string;

    if (!accessToken) {
      this.logger.error('No authorization token', CheckTokensGlobalMiddleware.name, {}, contextId);
      throw new Error(authMessages.LOGIN_ERROR);
    }

    await this.checkTokens(req, accessToken, contextId);

    if (req['entity'] === 'client') {
      return;
    }

    const {
      sub: keycloakId,
      session_state: keycloakSession,
    } = <TokenInterface>jwtDecode(accessToken);

    const ip = requestIp.getClientIp(req);

    const {
      profileInfo, rolesInfo,
    } = await this.getUserInfo(keycloakId, ip, userInfoToken, contextId);

    req['userInfo'] = {
      ...profileInfo,
      keycloakId,
    } as IGetUserInfo;
    req['rolesInfo'] = rolesInfo;
    req['keycloakSession'] = keycloakSession;
  }

  async use(req: ContextRequestInterface, res: Response, next: NextFunction) {
    try {
      await this.checkUserInfo(req);
      next();
    } catch (e) {
      const error = e.response ? e.response.message : e.message;

      this.logger.error('Middleware error', CheckTokensGlobalMiddleware.name, {
        error,
      }, req.contextId || '');
      throw new UnauthorizedException({ message: authMessages.LOGIN_ERROR });
    }
  }
}
