import { Injectable } from '@nestjs/common';

import PostgresService from '../postgres/postgres.service';
import { CustomLogger } from '../logger/custom.logger';

import CollectionsDto from './dto/collections.dto';

@Injectable()
export default class CollectionsService {
  constructor(
    private postgresService: PostgresService,
    private logger: CustomLogger,
    ) {}

  async getList() {
    const data = await this.postgresService.query(`
        SELECT
            id,
            name,
            (SELECT COUNT(1) FROM clothes c WHERE c.collection_id = id) as "count",
            created_at as "createdAt"
        FROM collections
    `);
    return {
      data,
      message: 'get collections success',
    };
  }

  async create(dto: CollectionsDto) {
    const { name } = dto;
    const params = [name];

    const [data] = await this.postgresService.query(
      `
      INSERT INTO collections (name, created_at, updated_at)
      VALUES ($1, now(), now())
      RETURNING id, name
    `,
      params,
    );
    return {
      data,
      message: 'collection created',
    };
  }

  async getDetail(id, contextId = '') {
    this.logger.log('Получение детальной информации по коллекции', CollectionsService.name, id, contextId);
    const [data] = await this.postgresService.query(`
        SELECT
            id,
            name,
            created_at,
            updated_at
        FROM collections
        WHERE id = $1
    `, [id]);
    return {
      data,
      message: 'Успешное получение коллекции',
    };
  }

  async update(id, dto, contextId = '') {
    this.logger.log('Обновление коллекции', CollectionsService.name, { id, dto }, contextId);
    await this.postgresService.query(`
      UPDATE collections SET
          name = $2,
          updated_at = now()
      WHERE id = $1
    `, [id, dto.name]);
    return {
      message: 'Успешное обновление коллекции',
    };
  }

  async delete(id, contextId = '') {
    this.logger.log('Удаление коллекции', CollectionsService.name, id, contextId);
    await this.postgresService.query(`
      DELETE FROM collections WHERE id = $1
    `, [id]);
    return {
      message: 'Успешное удаление коллекции',
    };
  }
}
