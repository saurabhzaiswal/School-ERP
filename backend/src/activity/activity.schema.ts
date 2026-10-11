import { Controller, Get, Injectable, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { PrismaService } from '../prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { pageQuery, perPageQuery, parse } from '../validation.js';

export const querySchema = z
  .object({
    page: pageQuery,
    per_page: perPageQuery,
    q: z.string().trim().max(100).optional(),
    actorId: z.uuid().optional(),
    role: z.enum(['ADMIN', 'TEACHER']).optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
  })
  .strict()
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    'Start date must be on or before end date',
  );

