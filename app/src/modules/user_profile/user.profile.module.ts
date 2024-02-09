import { Module } from '@nestjs/common';

import UserProfileController from './user.profile.controller';

import UserProfileService from './user.profile.service';

import OrdersModule from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [UserProfileController],
  providers: [UserProfileService],
})
export default class UserProfileModule {}
