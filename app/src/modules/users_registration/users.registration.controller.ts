import { Body, Controller, Post } from '@nestjs/common';

import { UsersRegistrationDto } from './dto/users.registration.dto';

import UsersRegistrationService from './users.registration.service';
import { Context } from '../../middlewares/context-id.middleware';

@Controller('registration')
export default class UsersRegistrationController {
  constructor(private usersRegistrationService: UsersRegistrationService) {}

  @Post()
  async create(@Body() dto: UsersRegistrationDto, @Context() context) {
    return this.usersRegistrationService.create(dto, context);
  }
}
