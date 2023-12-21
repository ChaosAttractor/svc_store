import { Body, Controller, Get, Post } from '@nestjs/common';

import OrdersCreateDto from './dto/orders-create.dto';
import OrdersService from './orders.service';

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

  @Get('')
  async getOrders() {
    const data = await this.ordersService.getOrders();
    return {
      data,
      message: 'orders get',
    };
  }
}
