import { Request } from 'express';
import IGetUserInfo from './get-user.info.interface';
import { RightsInfoInterface } from './rights.info.interface';

export interface RequestInterface extends Request {
  contextId: string,
  entity: string,
  keycloakSession?: string,
  rolesInfo?: RightsInfoInterface,
  userInfo?: IGetUserInfo,
}
