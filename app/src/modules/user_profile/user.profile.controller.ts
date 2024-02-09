import { Controller, Get } from '@nestjs/common';

import UserProfileService from './user.profile.service';
import OrdersService from '../orders/orders.service';

import IGetUserInfo from '../../interfaces/get-user.info.interface';

import GetUserInfoDecorator from '../../decorators/getUserInfo.decorator';

import { Context } from '../../middlewares/context-id.middleware';

@Controller('user/profile')
export default class UserProfileController {
  constructor(
    private userProfileService: UserProfileService,
    private ordersService: OrdersService,
  ) {
  }

  @Get()
  async getUserInfo(@GetUserInfoDecorator() userInfo: IGetUserInfo) {
    return userInfo;
  }

  @Get('/orders')
  async getOrders(@GetUserInfoDecorator() { userId }: IGetUserInfo, @Context() context) {
    return this.ordersService.getPersonalOrders(userId, context);
  }
}
