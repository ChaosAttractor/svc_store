import {
  Body, Controller, Get, Param, Patch, Post,
} from '@nestjs/common';

import DeliveryService from './delivery.service';

import DeliveryDto from './dto/delivery.dto';

@Controller('delivery')
export default class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get()
  async getList() {
    return this.deliveryService.getList();
  }

  @Get(':id')
  async getDetail(@Param('id') id: number) {
    return this.deliveryService.getDetail(id);
  }

  @Post()
  async create(@Body() dto: DeliveryDto) {
    return this.deliveryService.create(dto);
  }

  @Patch(':id')
  async update(@Body() dto: DeliveryDto, @Param('id') id: number) {
    return this.deliveryService.update(id, dto);
  }
}
