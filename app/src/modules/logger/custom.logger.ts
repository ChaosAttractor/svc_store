/* eslint  @typescript-eslint/no-var-requires: 1 */

import { Injectable, ConsoleLogger, LoggerService, Inject } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';

import { LoggerData, LoggerModuleConfig } from './interfaces';

import winstonCommonConfig from '../../config/winston.common.config';
import { LOGGER_CONFIG } from '../../const/logger';

import isEmptyObject from '../../utils/isEmptyObject';

/**
 * Сборка сообщения для логгера
 * @param message
 * @param payload
 * @param contextId
 */
const buildMessage = (message: string, payload: any = {}, contextId = '') => {
  if (typeof payload === 'string') {
    return `${message} || ${payload} || ${contextId}`;
  }
  const data = { ...payload };
  if (contextId) {
    data.contextId = contextId;
  }
  const dataString = data && !isEmptyObject(data) ? ` || ${JSON.stringify(data)}` : '';
  return `${message}${dataString}`;
};

/**
 * Кастомный класс логгера,
 * который выводит информацию в консоль и отправляет её в заданные системы.
 */
@Injectable()
export class CustomLogger extends ConsoleLogger {
  // основной winston
  private readonly winston: LoggerService;

  // внутренний winston, используется для debug
  private readonly winstonInner: LoggerService;

  constructor(@Inject(LOGGER_CONFIG) private config: LoggerModuleConfig) {
    super();
    const configCopy = { ...this.config };
    configCopy.winston = configCopy.winston || winstonCommonConfig;

    this.winstonInner = WinstonModule.createLogger(configCopy.winston);

    this.winston = WinstonModule.createLogger(configCopy.winston);
  }

  getContext(context) {
    return this.context || context || 'NestApp';
  }

  log(message: string, context?: string, data: any = {}, contextId = '') {
    this.logWrapper({
      message,
      data,
      context,
      level: 6,
      method: 'log',
      contextId,
    });
  }

  warn(message: string, context?: string, data: any = {}, contextId = '') {
    this.logWrapper({
      message,
      data,
      context,
      level: 4,
      method: 'warn',
      contextId,
    });
  }

  error(message: string, context?: string, data: any = {}, contextId = '') {
    this.logWrapper({
      message,
      data,
      context,
      level: 3,
      method: 'error',
      contextId,
    });
  }

  debug(message: any, context?: string, data?: string, contextId?: string) {
    const msg = buildMessage(message, data, contextId);
    const ctx = this.getContext(context);
    this.winstonInner.debug(msg, ctx);
    console.debug(message);
  }

  logWrapper(loggerData: LoggerData): void {
    const { method, message, data, context, contextId } = loggerData;

    const ctx = this.getContext(context);

    const msg = buildMessage(message, data, contextId);
    this.winston[method](msg, ctx);
  }
}
