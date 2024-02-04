import {
  Body, Controller, Get, Post, Req, Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import AuthService from './auth.service';
import { Context } from '../../middlewares/context-id.middleware';
import AuthDto from './dto/auth.dto';
import { IpAddress } from '../../decorators/getIpAddress.decorator';
import PromiseApiResponse from '../../dto/promise.response.dto';
import ResponseDto from '../../dto/response.dto';
import GetSessionId from '../../decorators/getSessionId.decorator';

@Controller('auth')
export default class AuthController {
  constructor(private authService: AuthService) {
  }

  @Post('login')
  async login(
    @Body() dto: AuthDto,
    @IpAddress() ip: string,
    @Context() contextId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto> {
    return this.authService.login(res, dto, ip, contextId);
  }

  @Get('status')
  async status(
    @Context() contextId: string,
    @Res({ passthrough: true }) res: Response,
    @IpAddress() ip: string,
    @Req() req: Request,
  ): Promise<void> {
    return this.authService.checkStatus(res, req, ip, contextId);
  }

  @Post('logout')
  async logout(
    @Res({ passthrough: true }) res: Response,
    @GetSessionId() keycloakSession: string,
    @Context() contextId: string,
  ): PromiseApiResponse {
    console.log(keycloakSession);
    return this.authService.logoutUser(res, keycloakSession, contextId);
  }
}
