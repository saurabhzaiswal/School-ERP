import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { PrismaService } from '../prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import {
  grade,
  section,
  pageQuery,
  perPageQuery,
  parse,
  uuid,
  gender,
  phoneNumber,
} from '../validation.js';

export const assignment = z.object({ grade, section }).strict();
export const userInput = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .email()
      .max(255)
      .transform((value) => value.toLowerCase()),
    gender: gender.nullable().optional(),
    phoneNumber,
    role: z.enum(['ADMIN', 'TEACHER']),
    active: z.boolean().default(true),
    password: z.string().min(10).max(100),
    assignments: z.array(assignment).max(48).default([]),
  })
  .strict();
export const userPatch = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z
      .email()
      .max(255)
      .transform((value) => value.toLowerCase())
      .optional(),
    gender: gender.nullable().optional(),
    phoneNumber,
    role: z.enum(['ADMIN', 'TEACHER']).optional(),
    active: z.boolean().optional(),
    password: z.string().min(10).max(100).optional(),
    assignments: z.array(assignment).max(48).optional(),
  })
  .strict();
export const listQuery = z
  .object({
    q: z.string().trim().max(100).optional(),
    role: z.enum(['ADMIN', 'TEACHER']).optional(),
    active: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    page: pageQuery,
    per_page: perPageQuery,
  })
  .strict();

export function validateAssignments(
  role: 'ADMIN' | 'TEACHER',
  rows: { grade: string; section: string }[],
) {
  if (role === 'ADMIN' && rows.length)
    throw new BadRequestException('Admin users do not have class assignments');
  if (role === 'TEACHER' && !rows.length)
    throw new BadRequestException(
      'Assign at least one class and section to a teacher',
    );
  const keys = rows.map((row) => `${row.grade}:${row.section}`);
  if (new Set(keys).size !== keys.length)
    throw new BadRequestException('Duplicate class assignment');
}
export function publicUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}
export function uniqueError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

