import { Injectable } from '@nestjs/common';
import PostgresService from '../postgres/postgres.service';
import { CustomLogger } from '../logger/custom.logger';

@Injectable()
export default class DeliveryService {
  constructor(
    private postgresService: PostgresService,
    private logger: CustomLogger,
    ) {}

  async getList(contextId = '') {
    this.logger.log('Получение сервисов доставки', DeliveryService.name, { }, contextId);
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

  async getDetail(id, contextId = '') {
    this.logger.log('Получение детальной информации сервиса доставки', DeliveryService.name, { id }, contextId);
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

  async create(dto, contextId = '') {
    this.logger.log('Добавление сервиса доставки', DeliveryService.name, { dto }, contextId);
    await this.postgresService.query(`
      INSERT INTO delivery (name, price, created_at, updated_at)
      VALUES ($1, $2, now(), now())
    `, [dto.name, dto.price]);
    return {
      message: 'Успешное добавление сервиса доставки',
    };
  }

  async update(id, dto, contextId = '') {
    this.logger.log('Обновление сервиса доставки', DeliveryService.name, { id, dto }, contextId);
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

  async delete(id, contextId = '') {
    this.logger.log('Удаление сервиса доставки', DeliveryService.name, { id }, contextId);
    await this.postgresService.query(`
      DELETE FROM delivery WHERE id = $1
    `, [id]);
    return {
      message: 'Успешное удаление сервиса доставки',
    };
  }
}
