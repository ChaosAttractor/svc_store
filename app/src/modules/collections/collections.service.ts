import { Injectable } from '@nestjs/common';
import PostgresService from '../postgres/postgres.service';

@Injectable()
export default class CollectionsService {
  constructor(private readonly postgresService: PostgresService) {}

  async getList() {
    const data = await this.postgresService.query(`
        SELECT
            id,
            name
        FROM collections
    `);
    return { data };
  }

  async create(dto) {
    const { name } = dto;
    const params = [name];

    const [data] = await this.postgresService.query(
      `
      INSERT INTO collections (name) VALUES ($1)
      RETURNING id, name
    `,
      params,
    );
    return { data };
  }
}