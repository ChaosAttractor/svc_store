import { NestFactory } from '@nestjs/core';

import * as bodyParser from 'body-parser';

import * as cookieParser from 'cookie-parser';

import AppModule from './app.module';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  app.use(bodyParser.json({ limit: '60mb' }));
  app.use(bodyParser.urlencoded({ limit: '60mb', extended: true }));

  app.enableCors({
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    origin: true,
  });

  app.use(cookieParser(process.env.COOKIE_SECRET));

  const port = +process.env.SVC_PORT || 8080;
  const host = process.env.SVC_HOSTNAME || '0.0.0.0';
  await app.listen(port, host);
};

bootstrap().then();
