import { Module } from '@nestjs/common';

import DeliveryController from './delivery.controller';

import DeliveryService from './delivery.service';

@Module({
  providers: [DeliveryService],
  controllers: [DeliveryController],
})
export default class DeliveryModule {}
