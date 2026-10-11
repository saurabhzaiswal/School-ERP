import { Controller, Get, Injectable, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { PrismaService } from '../prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { pageQuery, perPageQuery, parse } from '../validation.js';
import { querySchema } from './activity.schema.js';
import type { Actor } from '../auth/auth.schema.js';

@Injectable()
export class ActivityService {
  constructor(
    private readonly db: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async list(query: z.infer<typeof querySchema>, request: Request) {
    const actor = await this.auth.actor(request);
    const take = query.per_page ?? 20;
    const endExclusive = query.dateTo
      ? new Date(`${query.dateTo}T00:00:00.000Z`)
      : null;
    endExclusive?.setUTCDate(endExclusive.getUTCDate() + 1);
    const where = {
      action: { notIn: ['SESSION_LOGIN', 'SESSION_LOGOUT'] },
      ...(actor.role === 'TEACHER'
        ? { actorId: actor.id }
        : query.actorId
          ? { actorId: query.actorId }
          : {}),
      ...(actor.role === 'ADMIN' && query.role
        ? { actor: { role: query.role } }
        : {}),
      ...(query.dateFrom || endExclusive
        ? {
            createdAt: {
              ...(query.dateFrom
                ? { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) }
                : {}),
              ...(endExclusive ? { lt: endExclusive } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { action: { contains: query.q, mode: 'insensitive' as const } },
              { summary: { contains: query.q, mode: 'insensitive' as const } },
              {
                actor: {
                  name: { contains: query.q, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.db.$transaction([
      this.db.activityLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * take,
        take,
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      this.db.activityLog.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      per_page: take,
      total_pages: Math.ceil(total / take),
    };
  }
}

