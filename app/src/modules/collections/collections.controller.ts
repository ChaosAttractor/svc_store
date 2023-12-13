import { Body, Controller, Get, Post } from '@nestjs/common';
import CollectionsService from './collections.service';
import CollectionsCreateDto from './dto/collections-create.dto';

@Controller('collections')
export default class CollectionsController {
  constructor(private collectionsService: CollectionsService) {}

  @Get()
  async getList() {
    const data = await this.collectionsService.getList();
    return {
      data,
      message: 'get collections success',
    };
  }

  @Post()
  async create(@Body() dto: CollectionsCreateDto) {
    const data = await this.collectionsService.create(dto);
    return {
      data,
      message: 'collection created',
    };
  }
}
