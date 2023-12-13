import * as Minio from 'minio';

import minioConfig from '../config/minio.config';

export default new Minio.Client(minioConfig);
