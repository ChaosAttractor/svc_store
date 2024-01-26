import { createParamDecorator, ExecutionContext, Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

/**
 * Middleware для установки уникального id для запроса
 */
@Injectable()
export default class SetContextIdGlobalMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req['contextId'] = req.headers['x-context-id'] || nanoid(8);
    next();
  }
}

/**
 * Декоратор для получения уникального id запроса
 */
export const Context = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest();
  return req.contextId;
});
