import { LoggerOptions } from 'winston';
import * as Transport from 'winston-transport';

export interface WinstonLoggerConfig extends LoggerOptions {
  level: string;
  json: boolean;
  transports: Transport[];
}

export interface LoggerModuleConfig {
  winston?: WinstonLoggerConfig;
}

export interface LoggerData {
  method: 'log' | 'error' | 'warn';
  level: number;
  context: string;
  message: string;
  data: any;
  contextId: string;
}

export interface LoggerRequestData {
  handler?: string;
  action?: string;
  instance?: string;
  errorMessage?: string;
  now?: number;
  data?: any;
  user?: string;
  contextId?: string;
}

export interface LoggerTokenInterface {
  azp: string;
  realm_access: { roles: string[] };
  email: string;
  active: boolean;
  session?: string;
  tech?: string;
  session_id?: string;
  is_public_api?: boolean;
  expired?: string;
}
