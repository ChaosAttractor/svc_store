import { Body, Controller, Post } from '@nestjs/common';

import OrdersService from './orders.service';
import OrdersCreateDto from './dto/orders-create.dto';

@Controller('orders')
export default class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('')
  async create(@Body() ordersCreateDto: OrdersCreateDto) {
    await this.ordersService.create(ordersCreateDto);
    return {
      message: 'order created',
    };
  }
}
