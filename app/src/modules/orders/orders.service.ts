import { Injectable } from '@nestjs/common';

import { PoolClient } from 'pg';

import PostgresService from '../postgres/postgres.service';

@Injectable()
export default class OrdersService {
  constructor(private readonly postgresService: PostgresService) {}

  async create(dto) {
    await this.postgresService.transaction(async (client) => {
      const orderId = await this.createOrder(client, dto);
      await this.addOrderItems(client, orderId, dto);
    });
  }

  private async createOrder(client: PoolClient, dto) {
    const { email, link, name, phone, country, address, zipCode, delivery, comment } = dto;
    const params = [email, link, name, phone, country, address, zipCode, delivery, comment];
    const {
      rows: [{ id }],
    } = await client.query<{ id: number }>(
      `
      INSERT INTO "orders" (email, link, name, phone, country, address, zip_code, delivery, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
      params,
    );
    return id;
  }

  private async addOrderItems(client: PoolClient, orderId: number, dto) {
    const { clothes } = dto;

    const insertClothesArray = [];
    clothes.forEach(({ id, quantity }) => {
      insertClothesArray.push(`(${orderId}, ${id}, ${quantity})`);
    });

    const sql = `
      INSERT INTO "orders_clothes" (order_id, clothes_id, quantity)
      VALUES --values
    `;
    const values = insertClothesArray.join(',\n');
    await client.query(sql.replace('--values', values));
  }
}
