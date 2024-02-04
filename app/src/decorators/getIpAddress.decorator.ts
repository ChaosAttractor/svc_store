import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as requestIp from 'request-ip';

export const IpAddress = createParamDecorator((_, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest();
  return requestIp.getClientIp(req);
});
