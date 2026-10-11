import { Controller, Get, Injectable, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { PrismaService } from '../prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { pageQuery, perPageQuery, parse } from '../validation.js';
import { querySchema } from './activity.schema.js';
import type { Actor } from '../auth/auth.schema.js';
import { ActivityService } from './activity.service.js';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}
  @Get() list(@Req() request: Request, @Query() query: unknown) {
    return this.activity.list(parse(querySchema, query), request);
  }
}
