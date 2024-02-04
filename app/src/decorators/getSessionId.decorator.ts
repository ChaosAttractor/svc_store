import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const GetSessionId = createParamDecorator((
  _,
  context: ExecutionContext,
): string => context.switchToHttp().getRequest().keycloakSession);
export default GetSessionId;
