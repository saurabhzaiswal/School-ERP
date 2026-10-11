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
import { PrismaService } from './prisma.service.js';
import { parse } from './validation.js';
import { csrfForSession } from './csrf.js';
import { LoginDto } from './auth/dto/login.dto.js';

export type Actor = {
  id: string;
  name: string;
  email: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  phoneNumber?: string | null;
  role: 'ADMIN' | 'TEACHER';
  assignments: { grade: string; section: string }[];
  createdAt?: Date;
};
const loginSchema = z
  .object({ email: z.email(), password: z.string().min(1) })
  .strict();

@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService) {}
  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.active || !(await compare(password, user.passwordHash)))
      throw new UnauthorizedException('Invalid email or password');
    return user.id;
  }
  async actor(req: Request): Promise<Actor> {
    const id = req.session?.userId;
    if (!id) throw new UnauthorizedException('Please sign in');
    const user = await this.db.user.findUnique({
      where: { id },
      include: { assignments: true },
    });
    if (!user || !user.active)
      throw new UnauthorizedException('Please sign in');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      phoneNumber: user.phoneNumber,
      role: user.role,
      assignments: user.assignments.map(({ grade, section }) => ({
        grade,
        section,
      })),
      createdAt: user.createdAt,
    };
  }
  admin(actor: Actor) {
    if (actor.role !== 'ADMIN')
      throw new ForbiddenException('Admin access required');
  }
  classroom(actor: Actor, grade: string, section: string) {
    if (actor.role === 'ADMIN') return;
    if (
      !actor.assignments.some((a) => a.grade === grade && a.section === section)
    )
      throw new ForbiddenException(
        'Class or section is outside your assignment',
      );
  }
}

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
