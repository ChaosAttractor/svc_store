import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RequestInterface } from '../interfaces/request.interface';
import commonMessages from '../const/common.messages';
import { CustomLogger } from '../modules/logger/custom.logger';

@Injectable()
export class MethodsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private logger: CustomLogger,
  ) {
  }

  /**
   * Проверка прав пользователя
   * @param request
   * @param params
   * @param contextId
   * @private
   */
  private checkUserRights(
    request: RequestInterface,
    params: {appMethods: string[], methods: string[], clientMethods: string[]},
    contextId,
  ): boolean {
    try {
      const {
        methods,
        clientMethods,
      } = params;

      if (!methods.length && clientMethods.length) {
        this.logger.error('Method unavailable to user', MethodsGuard.name);
        throw new ForbiddenException({ message: commonMessages.FORBIDDEN_ERROR });
      }

      const applicationAccess = true;

      if (!applicationAccess) {
        throw new ForbiddenException({ message: commonMessages.FORBIDDEN_ERROR });
      }

      request.userInfo = {
        ...request.userInfo,
        userRights: {},
      };
      return true;
    } catch (e) {
      this.logger.error(
        'GUARD ERROR : check user access ',
        MethodsGuard.name,
        {
          error: e,
          params,
          userAccess: {
          },
        },
        contextId,
      );
      throw new ForbiddenException({ message: commonMessages.FORBIDDEN_ERROR });
    }
  }

  /**
   * Проверяет наличие у пользователя авторизационного куки
   * Нужен для методов доступных только не авторизованному пользователю
   * @param request
   * @private
   */
  private static checkUnAuthorizeUser(request: RequestInterface) {
    const cookieToken = request.signedCookies['sessionId'];
    return !cookieToken;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const methods = this.reflector.get<string[]>('accessMethods', context.getHandler()) || [];
    const appMethods = this.reflector.get<string[]>('applicationAccessMethods', context.getClass()) || [];
    const clientMethods = this.reflector.get<string[]>('clientMethods', context.getHandler()) || [];
    const checkUnAuthorize = this.reflector.get<boolean>('CheckUnAuthorize', context.getHandler()) || false;

    const request: RequestInterface = context.switchToHttp().getRequest();

    /** Проверка на то, что пользователь не авторизован * */
    if (checkUnAuthorize) {
      return MethodsGuard.checkUnAuthorizeUser(request);
    }

    /** Если метод указана и является публичной, то пускаем дальше */
    if (methods.includes('public') || ![...appMethods, ...methods, ...clientMethods].length) {
      return true;
    }

    const { contextId } = request;

    return this.checkUserRights(request, { methods, appMethods, clientMethods }, contextId);
  }
}
