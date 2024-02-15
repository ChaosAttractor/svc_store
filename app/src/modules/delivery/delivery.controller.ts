import {
  Body, Controller, Delete, Get, Param, Patch, Post,
} from '@nestjs/common';

import DeliveryService from './delivery.service';

import DeliveryDto from './dto/delivery.dto';
import { Context } from '../../middlewares/context-id.middleware';

@Controller('delivery')
export default class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get()
  async getList(@Context() context) {
    return this.deliveryService.getList(context);
  }

  @Get(':id')
  async getDetail(@Param('id') id: number, @Context() context) {
    return this.deliveryService.getDetail(id, context);
  }

  @Post()
  async create(@Body() dto: DeliveryDto, @Context() context) {
    return this.deliveryService.create(dto, context);
  }

  @Patch(':id')
  async update(@Body() dto: DeliveryDto, @Param('id') id: number, @Context() context) {
    return this.deliveryService.update(id, dto, context);
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @Context() context) {
    return this.deliveryService.delete(id, context);
  }
}
