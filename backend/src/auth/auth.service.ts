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

