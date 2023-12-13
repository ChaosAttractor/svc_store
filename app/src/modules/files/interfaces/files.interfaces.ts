import internal from 'stream';

export interface FileCreate {
  fileId?: string;
  name: string;
  path: string;
  type: string;
  documentId: number;
  fileTypeId?: number;
}

export interface FileMinioMeta {
  size: number;
  originalName: string;
  mimetype: string;
}

export interface FileMinioGet extends FileMinioMeta {
  stream: internal.Readable;
}

export interface FileNameParseResult {
  id?: string;
  ext: string;
  minioPath: string;
  minioName: string;
  originalName: string;
  originalNameBase64: string;
}

export interface IdSql {
  id: number;
}
