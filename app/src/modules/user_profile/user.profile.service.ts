import { Injectable } from '@nestjs/common';
import PostgresService from '../postgres/postgres.service';

@Injectable()
export default class UserProfileService {
  constructor(private postgresService: PostgresService) {
  }

  async getUserInfo() {
    return true;
  }
}
