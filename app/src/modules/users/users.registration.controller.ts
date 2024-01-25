import { Body, Controller, Post } from '@nestjs/common';

import { UsersRegistrationDto } from './dto/users.registration.dto';

import UsersRegistrationService from './users.registration.service';

@Controller('registration')
export default class UsersRegistrationController {
  constructor(private usersRegistrationService: UsersRegistrationService) {}

  @Post()
  async create(@Body() dto: UsersRegistrationDto) {
    return this.usersRegistrationService.create(dto);
  }
}
