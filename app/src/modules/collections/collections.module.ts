import { Module } from '@nestjs/common';

import CollectionsController from './collections.controller';
import CollectionsService from './collections.service';

@Module({
  providers: [CollectionsService],
  controllers: [CollectionsController],
})
export default class CollectionsModule {}
