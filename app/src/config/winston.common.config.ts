import * as winston from 'winston';
import { ConsoleTransportInstance } from 'winston/lib/winston/transports';

import { WinstonLoggerConfig } from '../modules/logger/interfaces';

interface WinstonInfoPrettyFix extends winston.Logform.TransformableInfo {
  stack: string;
  context: string;
  timestamp: string;
}

const format = [
  winston.format.colorize({
    level: true,
    message: true,
  }),
  winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
  winston.format.printf((info) => {
    const infoFix = info as WinstonInfoPrettyFix;
    return `${infoFix.level}: [${infoFix.context || infoFix.stack || 'NestApp'}] ${[
      infoFix.timestamp,
    ]} ${infoFix.message}`;
  }),
];

const transports: ConsoleTransportInstance[] = [
  new winston.transports.Console({
    format: winston.format.combine(...format),
  }),
];

export default {
  level: 'info',
  json: true,
  transports,
} as WinstonLoggerConfig;
