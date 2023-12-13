import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import ClothesService from './clothes.service';

import { ClothesQuery } from './interfaces/clothes.interfaces';
import ClothesCreateDto from './dto/clothes-create.dto';

@Controller('clothes')
export default class ClothesController {
  constructor(private clothesService: ClothesService) {}

  @Get()
  async getList(@Query() query: ClothesQuery) {
    const data = await this.clothesService.getList(query);
    return {
      data,
      message: 'get clothes success',
    };
  }

  @Post()
  async create(@Body() dto: ClothesCreateDto) {
    await this.clothesService.create(dto);
    return {
      message: 'clothes created',
    };
  }
}
