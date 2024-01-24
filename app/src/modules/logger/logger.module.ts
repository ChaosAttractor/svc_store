import { Global, Module } from '@nestjs/common';

import { CustomLogger } from './custom.logger';

@Global()
@Module({
  exports: [CustomLogger],
  providers: [CustomLogger],
})
export default class LoggerModule {}
