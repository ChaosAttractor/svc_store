import {
 Body, Controller, Get, Post,
} from '@nestjs/common';

import OrdersCreateDto from './dto/orders-create.dto';
import OrdersService from './orders.service';
import { Context } from '../../middlewares/context-id.middleware';
import GetUserInfoDecorator from '../../decorators/getUserInfo.decorator';

@Controller('orders')
export default class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('')
  async create(
    @Body() ordersCreateDto: OrdersCreateDto,
    @GetUserInfoDecorator() { userId },
    @Context() context,
  ) {
    return this.ordersService.create(ordersCreateDto, userId, context);
  }

  @Get('')
  async getOrders() {
    return this.ordersService.getOrders();
  }
}
