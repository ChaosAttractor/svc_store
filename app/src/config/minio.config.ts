import { ClientOptions } from 'minio';

export default {
  endPoint: process.env.MINIO_HOST || 'localhost',
  port: +process.env.MINIO_PORT || 9000,
  accessKey: process.env.MINIO_ROOT_USER || 'user',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'secret',
  useSSL: !!process.env.MINIO_USE_SSL,
} as ClientOptions;
