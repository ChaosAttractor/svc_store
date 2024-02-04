import { Transform } from 'class-transformer';

export default class TokenDto {
  @Transform(({ value }) => value && value.replace('Bearer ', ''))
  accessToken?: string;

  refreshToken?: string;
}
