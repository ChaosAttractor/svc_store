import { Module } from '@nestjs/common';
import TokensService from './tokens.service';

@Module({
  exports: [TokensService],
  providers: [TokensService],
})
export default class TokensModule {}
