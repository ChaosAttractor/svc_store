import { Injectable } from '@nestjs/common';

import { PoolClient } from 'pg';

import PostgresService from '../postgres/postgres.service';
import OrdersCreateDto from './dto/orders-create.dto';
import { CustomLogger } from '../logger/custom.logger';

@Injectable()
export default class OrdersService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly logger: CustomLogger,
    ) {}

  async create(dto: OrdersCreateDto, userId, contextId) {
    this.logger.log('Создание заказа', OrdersService.name, { dto, userId }, contextId);
    await this.postgresService.transaction(async (client) => {
      const orderId = await this.createOrder(client, dto, userId);
      await this.addOrderItems(client, orderId, dto);
    });
    return {
      message: 'order created',
    };
  }

  private async createOrder(client: PoolClient, dto: OrdersCreateDto, userId: string) {
    const {
      email,
      link,
      name,
      phone,
      country,
      address,
      zipCode,
      delivery,
      comment,
    } = dto;
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
          d.price as "deliveryPrice",
          o.created_at as "createdAt",
          o.updated_at as "updatedAt"
          FROM orders o
              LEFT JOIN delivery d ON d.id = o.delivery
              ORDER BY o.updated_at
    `);

    const orderIds = orders.map((order) => order.id);
    const clothes = await this.getOrderedClothes(orderIds);

    orders.map((order) => ({
      ...order,
      clothes: clothes.filter((el) => el.orderId === order.id),
    }));

    return {
      data: orders,
      message: 'orders get',
    };
  }

  private async getOrderedClothes(ids) {
    return this.postgresService.query<{ orderId: number; [key: string]: unknown }>(`
      SELECT
          order_id as "orderId",
          c.name,
          quantity,
          c.price
            FROM orders_clothes oc
              LEFT JOIN clothes c ON c.id = oc.clothes_id
              WHERE order_id = ANY($1)
    `, [ids]);
  }

  /**
   * Получение заказов по ID пользователя
   * todo добавить поддержку query
   *
   * @param userId
   * @param contextId
   */
  async getPersonalOrders(userId, contextId) {
    this.logger.log('Получение списка заказов пользователя', OrdersService.name, { userId }, contextId);
    const data = await this.postgresService.query<{ id: number; [key: string]: unknown }>(`
      SELECT
        o.id,
        o.country,
        o.address,
        o.created_at as "createdAt"
      FROM orders o
      WHERE o.user_id = $1
    `, [userId]);
    const ids = data.map((item) => item.id);

    const clothes = await this.getOrderedClothes(ids);

    data.map((order) => ({
      ...order,
      clothes: clothes.filter((el) => el.orderId === order.id),
    }));

    return {
      data,
      message: 'get personal orders',
    };
  }
}
