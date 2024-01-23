import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicatorResult } from '@nestjs/terminus';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Сервис для работы с keycloak
 */
@Injectable()
export default class KeycloakApiService {
  private openidAxiosInstance: AxiosInstance;

  private baseInstance: AxiosInstance;

  constructor() {
    this.openidAxiosInstance = axios.create({
      baseURL: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect`,
      timeout: +process.env.KEYCLOAK_REQUEST_TIMEOUT || 10000,
      responseType: 'json',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    this.baseInstance = axios.create({
      baseURL: `${process.env.KEYCLOAK_URL}`,
      timeout: +process.env.KEYCLOAK_REQUEST_TIMEOUT || 10000,
      responseType: 'json',
    });
  }

  /**
   * POST запрос в openid keycloak. Используется для работы с токенами
   * @param url
   * @param payload
   * @param config
   */
  async openidPostRequest<T>(
    url: string,
    payload: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await this.openidAxiosInstance.post<T>(url, payload, config);
    return data;
  }

  /**
   * Проверяет статус кейклока
   */
  async healthCheck(): Promise<HealthIndicatorResult> {
    try {
      const {
        data: { status },
      } = await this.baseInstance.get('/health');
      if (status !== 'DOWN') {
        return {
          KEYCLOAK: {
            status: 'up',
            message: 'Keycloak connection is ok',
          },
        };
      }
      throw new Error('Keycloak status down');
    } catch (e) {
      throw new HealthCheckError('Keycloak connection failed', {
        KEYCLOAK: {
          status: 'down',
          message: e && e.message,
        },
      });
    }
  }
}
