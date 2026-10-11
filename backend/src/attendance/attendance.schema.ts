import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { PrismaService } from '../prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { RecordAttendanceDto } from './dto/record-attendance.dto.js';
import { CorrectAttendanceDto } from './dto/correct-attendance.dto.js';
import {
  dateOnly,
  grade,
  section,
  pageQuery,
  limitQuery,
  perPageQuery,
  pageSize,
  parse,
  uuid,
} from '../validation.js';

export const status = z.enum(['PRESENT', 'ABSENT', 'LATE']);
export const recordSchema = z
  .object({ studentId: uuid, date: dateOnly, status })
  .strict();
export const correctionSchema = z.object({ status }).strict();
export const classQuery = z
  .object({
    grade,
    section,
    date: dateOnly,
    page: pageQuery.optional(),
    per_page: perPageQuery,
    limit: limitQuery.optional(),
  })
  .strict();
export const historyQuery = z
  .object({
    page: pageQuery,
    per_page: perPageQuery,
    limit: limitQuery.optional(),
  })
  .strict();

