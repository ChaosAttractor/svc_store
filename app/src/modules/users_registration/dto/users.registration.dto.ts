import { Transform } from 'class-transformer';

export class UsersRegistrationDto {
  password?: string;

  @Transform(({ value }) => value || undefined)
  username?: string;

  @Transform(({ value }) => ([true, false].includes(value) ? value : undefined))
  enabled?: boolean;

  @Transform(({ value }) => value || undefined)
  email?: string;

  firstName?: string;

  lastName?: string;

  emailVerified?: boolean;

  keycloakId?: string;

  roles?: string[];
}
