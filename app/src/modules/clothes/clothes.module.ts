import { Module } from '@nestjs/common';

import ClothesController from './clothes.controller';
import ClothesService from './clothes.service';

@Module({
  providers: [ClothesService],
  controllers: [ClothesController],
})
export default class ClothesModule {}
