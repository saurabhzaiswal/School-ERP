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
export const loginSchema = z
  .object({ email: z.email(), password: z.string().min(1) })
  .strict();

