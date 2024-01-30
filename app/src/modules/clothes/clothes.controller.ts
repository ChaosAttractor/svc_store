import {
  Body, Controller, Get, Post, Query, UploadedFile, UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import ClothesService from './clothes.service';

import ClothesCreateDto from './dto/clothes-create.dto';
import { ClothesQuery } from './interfaces/clothes.interfaces';
import { Context } from '../../middlewares/context-id.middleware';
import ClothesGalleryDto from './dto/clothes-gallery.dto';

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

  @Post('/:id/gallery')
  async createGallery(@Body() dto: ClothesGalleryDto[], @Context() context) {
    return this.clothesService.createGallery(dto, context);
  }
}
