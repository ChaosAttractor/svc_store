import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import FilesGetDto from './dto/files-get.dto';
import FilesService from './files.service';

@Controller('files')
export default class FilesController {
  constructor(private filesService: FilesService) {}

  @Get()
  async getFile(@Query() { path }: FilesGetDto) {
    const { mimetype, size, stream, originalName } = await this.filesService.getFile(path);
    return new StreamableFile(stream, {
      type: mimetype,
      disposition: encodeURI(`attachment; filename="${originalName}"`),
      length: size,
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Body('path') path: string, @UploadedFile('file') file: Express.Multer.File) {
    const data = await this.filesService.uploadFile(file, path);
    return {
      data,
      message: 'safasf',
    };
  }
}
