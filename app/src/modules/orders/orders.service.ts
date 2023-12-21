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
      INSERT INTO "orders" (email, link, name, phone, country, address, zip_code, delivery, comment, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
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
      insertClothesArray.push(`(${orderId}, ${id}, ${quantity}, now(), now())`);
    });

    const sql = `
      INSERT INTO "orders_clothes" (order_id, clothes_id, quantity, created_at, updated_at)
      VALUES --values
    `;
    const values = insertClothesArray.join(',\n');
    await client.query(sql.replace('--values', values));
  }

  async getOrders() {
    const orders = await this.postgresService.query<{ id: number; [key: string]: unknown }>(`
      SELECT
          o.id,
          o.name,
          o.phone,
          o.email,
          o.country,
          o.address,
          o.zip_code as "zipCode",
          d.name as "delivery",
          d.price as "deliveryPrice"
          FROM orders o
              LEFT JOIN delivery d ON d.id = o.delivery
    `);

    const orderIds = orders.map((order) => order.id);
    const clothes = await this.getOrderedClothes(orderIds);

    orders.map((order) => {
      order.clothes = clothes.filter((el) => el.orderId === order.id);
    });

    return orders;
  }

  private async getOrderedClothes(ids) {
    const params = [ids];
    const data = await this.postgresService.query<{ orderId: number; [key: string]: unknown }>(
      `
      SELECT
          order_id as "orderId",
          c.name,
          quantity,
          c.price
            FROM orders_clothes oc
              LEFT JOIN clothes c ON c.id = oc.clothes_id
              WHERE order_id = ANY($1)
    `,
      params,
    );
    return data;
  }
}
