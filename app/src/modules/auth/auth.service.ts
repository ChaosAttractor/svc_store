import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';

import jwtDecode from 'jwt-decode';

import { Request, Response } from 'express';

import AuthDto from './dto/auth.dto';
import TokenDto from '../../dto/token.dto';
import ResponseDto from '../../dto/response.dto';
import {
  LoginDataResponse,
  StatusTokenResponse,
  TokenInterface,
} from './interfaces/auth.interfaces';

import KeycloakApiService from '../keycloak/keycloak.api.service';
import KeycloakAdminService from '../keycloak/keycloak.admin.service';
import TokensService from '../tokens/tokens.service';
import PostgresService from '../postgres/postgres.service';
import { CustomLogger } from '../logger/custom.logger';
import UsersGuardService from '../users_guard/users_guard.service';
import authMessages from './const/auth.messages';
import IGetUserInfo from '../../interfaces/get-user.info.interface';

@Injectable()
export default class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private keycloakApiService: KeycloakApiService,
    private keycloakAdminService: KeycloakAdminService,
    private tokensService: TokensService,
    private postgresService: PostgresService,
    private logger: CustomLogger,
    private usersGuardService: UsersGuardService,
  ) {
  }

  /**
   * Аутентификация в систему
   * */
  async login(
    res: Response,
    data: AuthDto,
    ip: string,
    contextId: string,
  ): Promise<ResponseDto> {
    try {
      const response = await this.loginRequest(data, ip, contextId);
      await this.checkAvailable(ip, response, contextId);
      const { access_token, refresh_token } = response;
      await this.tokensService.setLoginTokens(res, access_token, refresh_token, contextId);
      return { message: authMessages.LOGIN_SUCCESS };
    } catch (e) {
      const error = e.response ? e.response.data : e;

      this.logger.error('Login user error', AuthService.name, {
        error,
        username: data.username,
      });

      if (e.status === 403) {
        const responseData = e.response?.data?.termsRequired
          ? { termsRequired: true }
          : { accessError: true };

        throw new ForbiddenException({
          data: responseData,
          message: authMessages.LOGIN_ERROR,
        });
      }
      throw new BadRequestException({ message: authMessages.LOGIN_ERROR });
    }
  }

  /**
   * Проверка куки пользователя
   * Проверка выполняется при попадании запроса на nginx
   * Возвращает аутентификационный токен пользователя - accessToken
   * @param res
   * @param req
   * @param ip
   * @param contextId
   */
  async checkStatus(
    res: Response,
    req: Request,
    ip: string,
    contextId: string,
  ): Promise<void> {
    try {
      const { authorization } = req.headers;

      const cookieToken = req.signedCookies['sessionId'];

      if (!cookieToken && !authorization) {
        this.logger.error('User without cookie', AuthService.name, {}, contextId);
        throw new Error(authMessages.LOGIN_ERROR);
      }

      const authorizationAccessToken = authorization
        ? jwtDecode<TokenInterface>(authorization.replace('Bearer ', ''))
        : null;

      const isClient = authorizationAccessToken ? !!authorizationAccessToken.clientId : false;

      if (isClient) {
        await this.checkClientsTokens(res, authorization);
        return;
      }

      const {
        accessToken,
        refreshToken,
        sessionKey,
      } = await this.tokensService.getTokens(res, cookieToken, contextId);

      await this.checkTokens(res, sessionKey, accessToken, refreshToken, contextId);

      await this.setUserTokenInfo(res, ip, sessionKey, accessToken, contextId);
    } catch (e) {
      this.logger.error('CheckStatus error', AuthService.name, {
        error: e,
      }, contextId || '');

      // если произошла ошибка при активной сессии кейклока, завершаем её
      if (e.response?.data?.accessToken) {
        await this.logout({ accessToken: e.response.data.accessToken });
      }

      // если произошла не конфликтная ошибка, кидаем пользователя на разлогин
      if (!e.response || e.status !== 409) {
        throw new UnauthorizedException({ message: authMessages.LOGIN_ERROR });
      }

      // если произошла конфликтная ошибка при обновлении токенов,
      // говорим повторить запрос позже с новым токеном

      res.removeHeader('Set-Cookie');
      res.setHeader('X-Retry', 'true');

      throw new HttpException({
        message: authMessages.LOGIN_ERROR,
      }, 403);
    }
  }

  /**
   * Получение информации о пользователе для токена
   * @param res
   * @param ip
   * @param sessionKey
   * @param accessToken
   * @param contextId
   * @private
   */
  private async setUserTokenInfo(
    res: Response,
    ip: string,
    sessionKey: string,
    accessToken: string,
    contextId: string,
  ): Promise<void> {
    try {
      const keycloakId = jwtDecode<TokenInterface>(accessToken).sub;

      const rolesInfo = await this.usersGuardService.getUserRolesData(ip, keycloakId, contextId);

      // !todo унести в свой модуль
      const [profileInfo] = await this.postgresService.query<IGetUserInfo[]>(`
        SELECT
          id AS "userId",
          keycloak_id AS "keycloakId",
          first_name AS "firstName",
          last_name as "lastName",
          TRIM(CONCAT(last_name, ' ', first_name)) AS "fullName",
          email
        FROM users
        WHERE keycloak_id = $1
        GROUP BY id, keycloak_id, first_name, last_name, email
      `, [keycloakId]);

      const userInfoToken = this.jwtService.sign({
        rolesInfo,
        profileInfo: {
          ...profileInfo,
        },
      }, { secret: process.env.COOKIE_SECRET });

      res.setHeader('X-User', userInfoToken);
    } catch (e) {
      const errorMessage = e.message;
      this.logger.error('Get userInfo error', AuthService.name, {
        errorMessage,
      }, contextId);
      await this.tokensService.dropTokens(res, sessionKey, contextId);
      throw new UnauthorizedException({
        message: authMessages.LOGIN_ERROR,
        data: { accessToken },
      });
    }
  }

  /**
   * Проверка токенов приложения
   * @param res
   * @param authorization
   * @private
   */
  private async checkClientsTokens(
    res: Response,
    authorization: string,
  ) {
    const accessToken = authorization.replace('Bearer ', '');

    const { data: { active } } = await this.statusToken({ accessToken });

    if (!active) {
      throw new UnauthorizedException({ message: authMessages.LOGIN_ERROR });
    }

    res.setHeader('Authorization', accessToken);
    res.sendStatus(200);
  }

  /**
   * Проверка аутентификационного токена пользователя
   * Проверка выполняется после прохождения запросом проверки nginx и при межсервисном обращении
   * @param res
   * @param sessionKey
   * @param accessToken
   * @param refreshToken
   * @param contextId
   * @private
   */
  private async checkTokens(
    res: Response,
    sessionKey: string,
    accessToken: string,
    refreshToken: string,
    contextId: string,
  ) {
    try {
      const { data } = await this.statusToken({ accessToken });
      if (data.active) {
        res.setHeader('Authorization', accessToken);
        return;
      }
      this.logger.warn('User token not active', AuthService.name, {}, contextId);
      const newAccessToken = await this.refreshToken(
        res,
        sessionKey,
        { accessToken, refreshToken },
        contextId,
      );
      res.setHeader('Authorization', newAccessToken);
    } catch (e) {
      if (e.response && e.status === 409) {
        throw new ConflictException({ message: authMessages.LOGIN_ERROR });
      }

      this.logger.error('User token expires', AuthService.name, {
        error: e,
        refreshToken,
      }, contextId);
      await this.tokensService.dropTokens(res, sessionKey, contextId);
      await this.logoutUser(res, sessionKey, contextId);
      throw new Error(authMessages.LOGIN_ERROR);
    }
  }

  /**
   * Отправка запроса на авторизацию в кк
   * @param data
   * @param ip
   * @param contextId
   */
  async loginRequest(data: AuthDto, ip: string, contextId: string): Promise<LoginDataResponse> {
    const payload = new URLSearchParams({
      username: data.username.trim(),
      password: data.password,
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      grant_type: 'password',
    });
    const config = {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
        'X-Forwarded-For': ip,
      },
    };
    this.logger.warn(`Login user - ${data.username}`, AuthService.name, {}, contextId);
    return this.keycloakApiService.openidPostRequest<LoginDataResponse>('/token', payload.toString(), config);
  }

  /**
   * Проверка наличия роли с доступом к платформе и наличия пользователя в базе
   * @param ip
   * @param dto
   * @param contextId
   * @private
   */
  private async checkAvailable(
    ip: string,
    dto: LoginDataResponse,
    contextId: string,
  ): Promise<void> {
    const { access_token: accessToken } = dto;
    const { sub: keycloakId } = <TokenInterface>jwtDecode(accessToken);
    try {
      await this.checkUserKeycloakAccess(keycloakId);

      await this.usersGuardService.checkRolesAvailable(
        ip,
        keycloakId,
        contextId,
      );
    } catch (e) {
      await this.logout({ accessToken });

      if (e.response) {
        throw new HttpException(e.response, e.status);
      }
      throw new Error(e);
    }
  }

  /**
   * Проверка наличия пользователя в базе
   * @param keycloakId
   */
  private async checkUserKeycloakAccess(keycloakId: string): Promise<void> {
    try {
      await this.postgresService.query(`
        SELECT id
        FROM users
        WHERE keycloak_id = $1
          AND enabled IS TRUE
      `, [keycloakId]);
    } catch (e) {
        this.logger.error('Login user error:: no keycloak access', AuthService.name);
        throw new BadRequestException({ message: authMessages.LOGIN_ERROR });
    }
  }

  /**
   * Обновление токена
   * */
  async refreshToken(
    res: Response,
    sessionKey: string,
    dto: TokenDto,
    contextId: string,
  ): Promise<string> {
    await this.tokensService.checkTokenIsBlock(sessionKey, dto.refreshToken, contextId);

    const payload = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: dto.refreshToken,
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
    });

    const data = await this.keycloakApiService.openidPostRequest<LoginDataResponse>(
      '/token',
      payload.toString(),
    );

    const dateNow = moment().unix();
    const refreshExpiresIn = data.refresh_expires_in;
    data.expired = dateNow + refreshExpiresIn;

    const {
      access_token, refresh_token,
    } = data;

    await this.tokensService.setRefreshTokens(
      res,
      sessionKey,
      access_token,
      refresh_token,
      contextId,
    );

    return access_token;
  }

  /**
   * Проверка активности токена
   * */
  async statusToken({ accessToken }: TokenDto): Promise<ResponseDto<StatusTokenResponse>> {
    const payload = new URLSearchParams({
      token: accessToken,
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
    });

    const data = await this.keycloakApiService.openidPostRequest<StatusTokenResponse>(
      '/token/introspect',
      payload.toString(),
    );
    return {
      data,
      message: authMessages.STATUS_TOKEN_SUCCESS,
    };
  }

  /**
   * Завершение сессии пользователя
   * @param res
   * @param keycloakSession
   * @param contextId
   */
  async logoutUser(
    res: Response,
    keycloakSession: string,
    contextId: string,
  ): Promise<ResponseDto> {
    const {
      accessToken,
      refreshToken,
      sessionKey,
    } = await this.tokensService.getAuthorizationTokensByKeycloakSession(keycloakSession);
    try {
      await this.logout({
        accessToken,
        refreshToken,
      });
      await this.tokensService.dropTokens(res, sessionKey, contextId);
      return {
        message: authMessages.LOGOUT_SUCCESS,
      };
    } catch (e) {
      await this.tokensService.dropTokens(res, sessionKey, contextId);
      return {
        message: authMessages.LOGOUT_SUCCESS,
      };
    }
  }

  /**
   * Выход из учетной записи и завершение текущей сессии
   * */
  async logout({ accessToken }: TokenDto): Promise<ResponseDto> {
    const active = await this.statusToken({ accessToken });
    if (!active) {
      throw new BadRequestException({ message: authMessages.LOGOUT_ERROR });
    }
    const session = this.jwtService.decode(accessToken)['session_state'];
    await this.keycloakAdminService.realmsRemoveSession(session);
    return {
      message: authMessages.LOGOUT_SUCCESS,
    };
  }

  /**
   * Завершение сессии пользователя по keycloakId
   * Используется, когда администратор меняет username/password/enabled у пользователя
   * @param id
   */
  async logoutByKeycloakId(id: string): Promise<void> {
    await this.keycloakAdminService.usersLogout(id);
  }

  /**
   * Завершение остальных сессий пользователя
   * @param id
   * @param sessionId
   */
  async logoutOthersSessionsByKeycloakId(id: string, sessionId: string): Promise<void> {
    const sessions = await this.keycloakAdminService.getUserSessions(id);
    const othersSessions = sessions.filter((el) => el.id !== sessionId);
    if (!othersSessions.length) {
      return;
    }
    await Promise.all(
      othersSessions.map((el) => this.keycloakAdminService.realmsRemoveSession(el.id)),
    );
  }
}
