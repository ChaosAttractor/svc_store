import { Module } from '@nestjs/common';

import ClothesService from './clothes.service';
import ClothesController from './clothes.controller';

@Module({
  providers: [ClothesService],
  controllers: [ClothesController],
})
export default class ClothesModule {}
