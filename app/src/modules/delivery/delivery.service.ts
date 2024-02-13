import { Injectable } from '@nestjs/common';
import PostgresService from '../postgres/postgres.service';

@Injectable()
export default class DeliveryService {
  constructor(private readonly postgresService: PostgresService) {}

  async getList() {
    const data = await this.postgresService.query(`
        SELECT
            id,
            name,
            price,
            created_at,
            updated_at
        FROM delivery
    `);
    return {
      data,
      message: 'Успешное получение сервисов доставки',
    };
  }

  async getDetail(id) {
    const [data] = await this.postgresService.query(`
        SELECT
            id,
            name,
            price,
            created_at,
            updated_at
        FROM delivery
        WHERE id = $1
    `, [id]);
    return {
      data,
      message: 'Успешное получение сервисов доставки',
    };
  }

  async create(dto) {
    await this.postgresService.query(`
      INSERT INTO delivery (name, price, created_at, updated_at)
      VALUES ($1, $2, now(), now())
    `, [dto.name, dto.price]);
    return {
      message: 'Успешное добавление сервиса доставки',
    };
  }

  async update(id, dto) {
    await this.postgresService.query(`
      UPDATE delivery SET
          name = $2,
          price = $3,
          updated_at = now()
      WHERE id = $1
    `, [id, dto.name, dto.price]);
    return {
      message: 'Успешное обновление сервиса доставки',
    };
  }
}
