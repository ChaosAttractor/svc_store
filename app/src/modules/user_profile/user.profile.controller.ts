import { Controller, Get } from '@nestjs/common';

import UserProfileService from './user.profile.service';
import IGetUserInfo from '../../interfaces/get-user.info.interface';
import GetUserInfoDecorator from '../../decorators/getUserInfo.decorator';

@Controller('user/profile')
export default class UserProfileController {
  constructor(private userProfileService: UserProfileService) {
  }

  @Get()
  async getUserInfo(@GetUserInfoDecorator() userInfo: IGetUserInfo) {
    return userInfo;
  }
}
