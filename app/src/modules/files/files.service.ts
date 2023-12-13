import { Injectable } from '@nestjs/common';

import { randomUUID } from 'crypto';
import * as path from 'path';

import { FileMinioGet, FileMinioMeta, FileNameParseResult } from './interfaces/files.interfaces';

import minioClient from '../../utils/minio.client';

/**
 * Сервис для работы с файлами. Работа производится с minio и с базой данных
 */
@Injectable()
export default class FilesService {
  buildPath(name: string, dir: string) {
    return `${dir}/${name}`;
  }

  /**
   * Парсинг имени файла. В нынешней версии multer файл приходит в кодировке latin1.
   * Имя файла в minio - случайно сгенерированный uuid.
   * Для записи мета-информации об оригинальном названии файла в minio используется кодировка base64.
   * Для записи в базу используется кодировка utf-8
   * @param originalFileName - имя файла, пришедшее в запросе
   * @param dir - директория хранения файла в minio
   */
  parseFileName(originalFileName: string, dir: string): FileNameParseResult {
    const originalNameBuffer = Buffer.from(originalFileName, 'latin1');
    const originalNameBase64 = originalNameBuffer.toString('base64');
    const originalName = originalNameBuffer.toString('utf-8');
    const { ext } = path.parse(originalName);
    const id = randomUUID();
    const minioName = `${id}${ext}`;
    const minioPath = this.buildPath(minioName, dir);

    return {
      id,
      ext,
      minioPath,
      minioName,
      originalName,
      originalNameBase64,
    };
  }

  /**
   * Загрузка файла в minio
   * @param file - загруженный файл
   * @param dir - директория хранения файла в minio
   */
  async uploadFile(file: Express.Multer.File, dir: string): Promise<FileNameParseResult> {
    const result = this.parseFileName(file.originalname, dir);
    const { minioPath, originalNameBase64 } = result;
    try {
      await minioClient.putObject(process.env.MINIO_BUCKET, minioPath, file.buffer, {
        originalName: originalNameBase64,
        'content-type': file.mimetype,
      });
      return result;
    } catch (error) {
      console.error('Minio upload error', FilesService.name, { error });
      throw error;
    }
  }

  /**
   * Получение файла из minio
   *
   * @param minioPath - путь до файла в minio
   */
  async getFile(minioPath: string): Promise<FileMinioGet> {
    try {
      const stream = await minioClient.getObject(process.env.MINIO_BUCKET, minioPath);
      const meta = await this.getMeta(minioPath);
      return {
        ...meta,
        stream,
      };
    } catch (error) {
      console.error('Minio get file error', FilesService.name, { error });
      throw error;
    }
  }

  /**
   * Получение мета-информации файла из minio
   *
   * @param minioPath - путь до файла в minio
   */
  async getMeta(minioPath: string): Promise<FileMinioMeta> {
    try {
      const stat = await minioClient.statObject(process.env.MINIO_BUCKET, minioPath);
      const result: FileMinioMeta = {
        size: stat.size,
        originalName: '',
        mimetype: stat.metaData['content-type'],
      };
      if (stat.metaData?.originalname) {
        const buff = Buffer.from(stat.metaData?.originalname, 'base64');
        result.originalName = buff.toString('utf-8');
      }
      return result;
    } catch (error) {
      console.error('Minio get meta error', FilesService.name, { error });
      throw error;
    }
  }
}
