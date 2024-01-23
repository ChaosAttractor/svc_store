import {
  Injectable,
  CallHandler,
  HttpException,
  NestInterceptor,
  ExecutionContext,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import jwtDecode from 'jwt-decode';
import { catchError, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

import { CustomLogger } from './custom.logger';

import { LoggerTokenInterface, LoggerRequestData } from './interfaces';

import { REFLECTOR_FIX, UNEXPECTED_ERROR } from '../../const/logger';

/**
 * Сборка аргументов запроса для вывода
 * @param args
 */
const composeArgs = (args) => {
  const { body = {}, query = {}, params = {} } = args;
  return { ...body, ...query, ...params };
};

/**
 * Получение информации о пользователе из токена
 *
 * @param token
 */
const getClientInfo = (token: string): string => {
  if (!(token && token !== 'null') || !token.includes('Bearer')) {
    return '';
  }
  const { email, azp, tech } = jwtDecode.jwtDecode(token) as LoggerTokenInterface;
  if (email) {
    return ` || email: ${email}${tech ? ` (tech: ${tech})` : ''}`;
  }
  if (azp) {
    return ` ||  client: ${azp}`;
  }
  return '';
};

/**
 * Интерцептор для вывода время выполнения запросов и перехвата ошибок
 *
 * Выводит время выполнения запроса. При ошибке логирование ведется следующим образом:
 * 1. Если ошибку вызвали самостоятельно через throw,
 * то все ее данные будут прологированы (message и data) и отправлены дальше
 * 2. Если ошибка неизвестная (база упала или еще что-то)
 * за основу берется errorMessage и добавляются данные ошибки err.
 *
 * Поддерживаемые metadata переменные:
 *  - action: действие, название метода
 *  - errorMessage: стандартное сообщение об ошибке, которое будет выведено при перехвате
 *  - noLog: отключение отображения логов на методе
 *  - hide-data: отключение отображения аргументов запроса
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(REFLECTOR_FIX) private reflector: Reflector,
    private logger: CustomLogger,
  ) {}

  private requestFinish = (args: LoggerRequestData) => {
    const { action, now, instance, contextId } = args;
    return tap(() =>
      this.logger.log(
        `${action}. Request finished in ${Date.now() - now}ms`,
        instance,
        {},
        contextId,
      ),
    );
  };

  private requestError = (args: LoggerRequestData) =>
    catchError((err) => {
      this.logger.debug(err);
      const { now, user, action, instance, errorMessage, data: reqData, contextId } = args;

      const errMessage = `${action}. ${errorMessage} || ${err.message || ''}`;

      this.logger.error(errMessage, instance, err.data, contextId);
      this.logger.error(
        `${action} ${user}. Request finished with error in ${Date.now() - now}ms`,
        instance,
        reqData,
        contextId,
      );
      if (err.response) {
        const data = err.response?.data?.name?.includes('Sequelize') ? null : err.response.data;
        const errorPayload = {
          message: err.response.message,
          data,
        };
        return throwError(() => new HttpException(errorPayload, err.status || 503));
      }
      const data = err?.data?.name?.includes('Sequelize') ? null : err;
      return throwError(() => new ServiceUnavailableException({ message: errMessage, data }));
    });

  intercept(context: ExecutionContext, next: CallHandler) {
    const [args] = context.getArgs();
    const instance = context.getClass().name;
    const handler = context.getHandler();
    const request = context.switchToHttp().getRequest();
    const contextId = request.headers['x-context-id'] || request.contextId || '';

    const noLog = this.reflector.get<boolean>('noLog', handler);
    const hideData = this.reflector.get<boolean>('hide-data', handler);

    if (noLog) {
      return next.handle();
    }

    const now = Date.now();
    const reqData = hideData ? {} : composeArgs(args);
    const user = request.headers.authorization ? getClientInfo(request.headers.authorization) : '';

    const action = this.reflector.get<string>('action', handler) || handler.name;
    const errorMessage = this.reflector.get<string>('errorMessage', handler) || UNEXPECTED_ERROR;

    this.logger.log(`${action} ${user} Requesting...`, instance, reqData, contextId);

    return next
      .handle()
      .pipe(
        this.requestFinish({
          now,
          action,
          instance,
          contextId,
        }),
      )
      .pipe(
        this.requestError({
          now,
          user,
          action,
          errorMessage,
          data: reqData,
          instance,
          contextId,
        }),
      );
  }
}
