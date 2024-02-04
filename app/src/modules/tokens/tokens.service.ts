import {
  ConflictException, Injectable, OnApplicationBootstrap, UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import jwtDecode from 'jwt-decode';
import { Response } from 'express';
import * as moment from 'moment';

import authMessages from '../auth/const/auth.messages';
import { NAME } from './const/graph';

import { CustomLogger } from '../logger/custom.logger';
import RedisService from '../redis/redis.service';

import {
  GetAuthTokensInterface,
  GetTokensInterface,
  SessionRowInterface,
} from './interfaces/tokens.interfaces';
import { TokenInterface } from '../auth/interfaces/auth.interfaces';

@Injectable()
export default class TokensService implements OnApplicationBootstrap {
  private oldTokenLifespan;

  private tokenGraph;

  constructor(
    private redisService: RedisService,
    private logger: CustomLogger,
  ) {
    this.oldTokenLifespan = +process.env.OLD_TOKEN_LIFESPAN;
  }

  async onApplicationBootstrap() {
    return this.initializeGraph();
  }

  /**
   * Инициализация графа, создание индекса для сессий
   * @private
   */
  private async initializeGraph(): Promise<void> {
    // возвращает класс для обращения к redis
    this.tokenGraph = this.redisService.createGraph(NAME);
    await this.redisService.graphQuery(this.tokenGraph, 'CREATE INDEX ON :Session(sessionKey)');
    await this.redisService.graphQuery(this.tokenGraph, 'CREATE INDEX ON :Session(keycloakSession)');
  }

  /**
   * Получение данных сессии по ключу
   * @param sessionKey
   * @private
   */
  async getSessionByKey(sessionKey: string): Promise<GetTokensInterface> {
    const { data } = await this.redisService.graphRoQuery(this.tokenGraph, `
      MATCH (session: Session {sessionKey: $sessionKey}) RETURN session LIMIT 1
    `, { sessionKey }) as SessionRowInterface;
    if (!data.length) {
      return null;
    }
    const [{ session: { properties } }] = data;
    return properties;
  }

  /**
   * Получение информации о сессии пользователя по текущей кейклок сессии
   * @param keycloakSession
   * @private
   */
  private async getSessionByKeycloakSession(keycloakSession: string): Promise<GetTokensInterface> {
    const { data } = await this.redisService.graphRoQuery(this.tokenGraph, `
      MATCH (session: Session {keycloakSession: $keycloakSession}) RETURN session LIMIT 1
    `, { keycloakSession }) as SessionRowInterface;
    if (!data.length) {
      return null;
    }
    const [{ session: { properties } }] = data;
    return properties;
  }

  /**
   * Генерирует рандомный токен
   * @private
   */
  private static generateToken(): string {
    return randomBytes(512).toString('hex');
  }

  /**
   * Генерирует уникальный ключ сессии
   * @private
   */
  private async generateSessionKey(): Promise<string> {
    const sessionKey = TokensService.generateToken();
    const exist = await this.getSessionByKey(sessionKey);
    if (!exist) {
      return sessionKey;
    }
    return this.generateSessionKey();
  }

  /**
   * Устанавливает токены после авторизации
   * @param res
   * @param accessToken
   * @param refreshToken
   * @param contextId
   */
  async setLoginTokens(
    res: Response,
    accessToken: string,
    refreshToken: string,
    contextId: string,
  ): Promise<string> {
    const {
      sub: uid,
      session_state: keycloakSession,
    } = <TokenInterface>jwtDecode(accessToken);
    const expires = <number>jwtDecode(refreshToken)['exp'];

    const sessionKey = await this.generateSessionKey();
    const sessionToken = TokensService.generateToken();

    await this.redisService.graphQuery(this.tokenGraph, `
      CREATE (:Session {
        sessionKey: $sessionKey,
        accessToken: $accessToken,
        refreshToken: $refreshToken,
        sessionToken: $sessionToken,
        keycloakSession: $keycloakSession,
        uid: $uid,
        expires: $expires
      })
    `, {
      sessionKey,
      accessToken,
      refreshToken,
      sessionToken,
      keycloakSession,
      uid,
      expires,
    });

    const cookieToken = `${sessionKey}.${sessionToken}`;
    await this.setCookie(res, cookieToken, expires, contextId);

    return sessionKey;
  }

  /**
   * Устанавливает refreshToken
   * @param res
   * @param sessionKey
   * @param accessToken
   * @param refreshToken
   * @param contextId
   */
  async setRefreshTokens(
    res: Response,
    sessionKey: string,
    accessToken: string,
    refreshToken: string,
    contextId: string,
  ): Promise<void> {
    this.logger.log('Update users tokens', TokensService.name, {}, contextId);
    const {
      newSessionToken,
      expires,
    } = await this.updateSessionTokens(sessionKey, accessToken, refreshToken);
    const newCookieToken = `${sessionKey}.${newSessionToken}`;
    await this.setCookie(res, newCookieToken, expires, contextId);
  }

  /**
   * Обновляет токены сессии
   * @param sessionKey
   * @param accessToken
   * @param refreshToken
   */
  async updateSessionTokens(
    sessionKey: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<{ newSessionToken: string, expires: number }> {
    const {
      sessionToken,
      uid,
    } = await this.getSessionByKey(sessionKey);

    const newSessionToken = TokensService.generateToken();

    const eolOldSessionToken = <string>moment().add(this.oldTokenLifespan, 'minutes').format();

    const {
      session_state: keycloakSession,
    } = <TokenInterface>jwtDecode(accessToken);
    const expires = <number>jwtDecode(refreshToken)['exp'];

    await this.redisService.graphQuery(this.tokenGraph, `
      MATCH (session: Session {sessionKey: $sessionKey}) SET
        session.accessToken = $accessToken,
        session.refreshToken = $refreshToken,
        session.sessionToken = $newSessionToken,
        session.oldSessionToken = $sessionToken,
        session.eolOldSessionToken = $eolOldSessionToken,
        session.uid = $uid,
        session.keycloakSession = $keycloakSession,
        session.expires = $expires
    `, {
      sessionKey,
      accessToken,
      refreshToken,
      newSessionToken,
      sessionToken,
      eolOldSessionToken,
      uid,
      expires,
      keycloakSession,
    });
    return { newSessionToken, expires };
  }

  /**
   * Получает токены, сессию и keycloak пользователя по токену из куки
   * Проверяет на совпадение сессий
   * @param res
   * @param cookieToken
   * @param contextId
   */
  async getTokens(
    res: Response,
    cookieToken: string,
    contextId: string,
  ): Promise<GetTokensInterface> {
    const sessionKey = cookieToken.substring(0, 1024);
    const currentSession = cookieToken.substring(1025, 2049);

    const sessionProperties = await this.getSessionByKey(sessionKey);

    if (!sessionProperties) {
      this.logger.error('User with unknown session', TokensService.name, {}, contextId);
      await this.dropTokens(res, sessionKey, contextId);
      throw Error(authMessages.LOGIN_ERROR);
    }

    const {
      accessToken,
      refreshToken,
      sessionToken,
      oldSessionToken,
      eolOldSessionToken,
      uid,
      expires,
    } = sessionProperties;

    this.logger.log('User Redis Info success got', TokensService.name, {}, contextId);

    const unknownSession = currentSession !== sessionToken
      && currentSession !== oldSessionToken;

    const expiredSession = currentSession === oldSessionToken
      && moment() > moment(eolOldSessionToken);

    const conflictSession = unknownSession && moment() <= moment(eolOldSessionToken);

    if (conflictSession) {
      this.logger.error('User with conflict session token', TokensService.name, {
        conflictSession,
      }, contextId);

      throw new ConflictException({
        message: authMessages.LOGIN_ERROR,
      });
    }

    if (!conflictSession && (unknownSession || expiredSession)) {
      this.logger.error('User with unknown session token', TokensService.name, {
        unknownSession,
        expiredSession,
      }, contextId);
      await this.dropTokens(res, sessionKey, contextId);
      throw new UnauthorizedException({
        message: authMessages.LOGIN_ERROR,
        data: {
          accessToken,
        },
      });
    }

    if (currentSession === oldSessionToken) {
      this.logger.log('User with oldSessionToken', TokensService.name, {}, contextId);
      const newToken = `${sessionKey}.${sessionToken}`;
      await this.setCookie(res, newToken, expires, contextId);
    }

    // if (currentSession === sessionToken && oldSessionToken) {
    //   await this.redisService.setJsonItems(sessionKey, {
    //     accessToken,
    //     refreshToken,
    //     sessionToken,
    //     uid,
    //     expires,
    //   });
    // }

    const { session_state: sessionId } = <{ session_state: string }>jwtDecode(accessToken);

    return {
      sessionKey,
      accessToken,
      refreshToken,
      uid,
      sessionId,
    };
  }

  /**
   * Удаляет токены по id сессии
   * @param res
   * @param sessionKey
   * @param contextId
   */
  async dropTokens(res: Response, sessionKey: string, contextId: string): Promise<void> {
    await this.redisService.graphQuery(this.tokenGraph, `
      MATCH (session: Session {sessionKey: $sessionKey}) DELETE session
    `, { sessionKey });
    await this.redisService.dropJsonItem(sessionKey);
    this.dropCookie(res, contextId);
  }

  /**
   * Удаляет куки
   * @param res
   * @param contextId
   */
  private dropCookie(res: Response, contextId: string): void {
    this.logger.error('Drop cookie token', TokensService.name, {}, contextId);
    res.cookie('sessionId', '', {
      maxAge: -1,
      domain: process.env.FRONTEND_DOMAIN,
      expires: new Date(),
    });
  }

  /**
   * Устанавливает куки
   * @param res
   * @param cookieToken
   * @param expires_in
   * @param contextId
   */
  private async setCookie(
    res: Response,
    cookieToken: string,
    expires_in: number,
    contextId: string,
  ): Promise<void> {
    this.logger.log('Update user COOKIE', TokensService.name, {}, contextId);
    const expires = moment(Number(`${expires_in}000`)).add(3, 'hours').toDate();
    res.cookie('sessionId', cookieToken, {
      domain: process.env.FRONTEND_DOMAIN,
      httpOnly: true,
      secure: false,
      signed: true,
      expires,
    });
  }

  /**
   * Получает access/refresh токены для logout
   * @param keycloakSession
   */
  async getAuthorizationTokensByKeycloakSession(
    keycloakSession: string,
  ): Promise<GetAuthTokensInterface> {
    const {
      accessToken,
      refreshToken,
      sessionKey,
    } = await this.getSessionByKeycloakSession(keycloakSession);
    return {
      accessToken,
      refreshToken,
      sessionKey,
    };
  }

  /**
   * Проверяет возможность выполнения refreshToken
   * Одновременно может выполняться только один refresh для одной сессии
   * @param sessionKey
   * @param token
   * @param contextId
   */
  async checkTokenIsBlock(
    sessionKey: string,
    token: string,
    contextId: string,
  ): Promise<void> {
    const insertedRows = await this.redisService.setToSet(sessionKey, token);

    if (insertedRows !== 0) {
      return;
    }

    this.logger.warn('Block refresh token, return Retry', TokensService.name, {}, contextId);

    throw new ConflictException({ message: authMessages.LOGIN_ERROR });
  }
}
