import { Body, Controller, Post } from '@nestjs/common';
import UsersRegistrationService from './users.registration.service';

@Controller('registration')
export default class UsersRegistrationController {
  constructor(private usersRegistrationService: UsersRegistrationService) {}

  @Post()
  async create(@Body() payload) {
    return this.usersRegistrationService.create(payload);
  }
}
