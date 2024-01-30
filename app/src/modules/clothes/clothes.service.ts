import { Injectable } from '@nestjs/common';
import { ClothesInterface } from './interfaces/clothes.interfaces';
import { TOTAL_SELECT } from '../../const/sql';
import { TotalSelect } from '../../interfaces';
import PostgresService from '../postgres/postgres.service';
import ClothesGalleryDto from './dto/clothes-gallery.dto';
import { CustomLogger } from '../logger/custom.logger';

@Injectable()
export default class ClothesService {
  constructor(
    private postgresService: PostgresService,
    private logger: CustomLogger,
  ) {}

  async getList(query) {
    const title = query?.title;
    const collectionId = query?.collectionId;

    const params: unknown[] = [];

    let where = '';

    if (Object.keys(query).length) {
      where += 'WHERE';
    }
    if (title) {
      where += `name = $${params.length + 1}`;
      const ilikeTitle = `%${String(title).replace(' ', '%')}%`;
      params.push(ilikeTitle);
    }
    if (collectionId) {
      if (where !== 'WHERE') {
        where += ' AND ';
      }
      where += ` collection_id = $${params.length + 1} `;
      params.push(collectionId);
    }

    const sql = `
        SELECT
            --select
        FROM clothes
        --where
    `;

    const select = `
      id,
      name,
      collection_id as "collectionId",
      description,
      image_path as "imagePath",
      price
    `;

    const data = await this.postgresService.query<ClothesInterface[]>(
      sql.replace('--select', select).replace('--where', where),
      params,
    );
    const [{ total }] = await this.postgresService.query<TotalSelect>(
      sql.replace('--select', TOTAL_SELECT).replace('--where', where),
      params,
    );

    return {
      data,
      total,
    };
  }

  async create(dto) {
    const {
      name,
      collectionId,
      description,
      imagePath,
      price,
    } = dto;
    const params = [name, collectionId, description, imagePath, price];

    await this.postgresService.query(
      `
      INSERT INTO clothes (name, collection_id, description, image_path, price, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, now(), now())
    `,
      params,
    );
  }

  async createGallery(dto: ClothesGalleryDto[], contextId: string) {
    this.logger.log('Добавление галереи к товару', ClothesService.name, { dto }, contextId);
    const insertArray = [];

    dto.forEach((item) => {
      const clothesId = item.clothesId ? `'${item.clothesId}'` : null;
      const imagePath = item.imagePath ? `'${item.imagePath}'` : null;
      const order = item.order ? `'${item.order}'` : null;

      insertArray.push(`'gen_random_uuid()', ${clothesId}, ${imagePath}, ${order}, now(), now()`);
    });

    const values = insertArray.join(',\n');
    await this.postgresService.query(`
      INSERT INTO clothes_gallery (id, clothes_id, image_path, order, created_at, updated_at) VALUES ${values}
    `);
    return {
      message: 'Успешное создание/обновление галереи',
    };
  }
}
