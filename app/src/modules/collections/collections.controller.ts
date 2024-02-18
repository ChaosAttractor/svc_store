import {
  Body, Controller, Delete, Get, Param, Patch, Post,
} from '@nestjs/common';

import CollectionsService from './collections.service';

import CollectionsDto from './dto/collections.dto';

import { Context } from '../../middlewares/context-id.middleware';

@Controller('collections')
export default class CollectionsController {
  constructor(private collectionsService: CollectionsService) {}

  @Get()
  async getList() {
    return this.collectionsService.getList();
  }

  @Get(':id')
  async getDetail(@Param('id') id: number, @Context() context) {
    return this.collectionsService.getDetail(id, context);
  }

  @Post()
  async create(@Body() dto: CollectionsDto) {
    return this.collectionsService.create(dto);
  }

  @Patch(':id')
  async update(@Body() dto: CollectionsDto, @Param('id') id: number, @Context() context) {
    return this.collectionsService.update(id, dto, context);
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @Context() context) {
    return this.collectionsService.delete(id, context);
  }
}
