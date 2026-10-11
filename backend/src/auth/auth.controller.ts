import {
  Body,
  Controller,
  Get,
  Injectable,
  Post,
  Req,
  Res,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { compare } from 'bcryptjs';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaService } from '../prisma.service.js';
import { parse } from '../validation.js';
import { csrfForSession } from '../csrf.js';
import { LoginDto } from './dto/login.dto.js';
import { loginSchema, Actor } from './auth.schema.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = parse(loginSchema, body);
    const userId = await this.auth.login(data.email, data.password);
    await new Promise<void>((resolve, reject) =>
      request.session.regenerate((error) =>
        error ? reject(error) : resolve(),
      ),
    );
    request.session.userId = userId;
    await new Promise<void>((resolve, reject) =>
      request.session.save((error) => (error ? reject(error) : resolve())),
    );
    response.setHeader('x-csrf-token', csrfForSession(request.sessionID));
    return { ok: true };
  }
  @Post('logout') async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.actor(request);
    await new Promise<void>((resolve, reject) =>
      request.session.destroy((error) => (error ? reject(error) : resolve())),
    );
    response.clearCookie('school_session', { path: '/' });
    return { ok: true };
  }
  @Get('profile') async profile(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const actor = await this.auth.actor(req);
    response.setHeader('x-csrf-token', csrfForSession(req.sessionID));
    return actor;
  }
}
