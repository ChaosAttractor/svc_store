import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import IGetUserInfo from '../interfaces/get-user.info.interface';

const GetUserInfoDecorator = createParamDecorator((
  _,
  context: ExecutionContext,
): IGetUserInfo => context.switchToHttp().getRequest().userInfo || {});
export default GetUserInfoDecorator;
