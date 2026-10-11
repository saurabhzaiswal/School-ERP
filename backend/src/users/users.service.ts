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
import { assignment, userInput, userPatch, listQuery, validateAssignments, publicUser, uniqueError } from './users.schema.js';
import type { Actor } from '../auth/auth.schema.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async stats(actor: Actor) {
    this.auth.admin(actor);
    const rows = await this.db.user.groupBy({
      by: ['role', 'active'],
      _count: { _all: true },
    });
    return rows.reduce(
      (result, row) => {
        result.total += row._count._all;
        result[row.role === 'ADMIN' ? 'admins' : 'teachers'] += row._count._all;
        if (!row.active) result.inactive += row._count._all;
        return result;
      },
      { total: 0, admins: 0, teachers: 0, inactive: 0 },
    );
  }

  async list(query: z.infer<typeof listQuery>, actor: Actor) {
    this.auth.admin(actor);
    const take = query.per_page ?? 20;
    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' as const } },
              { email: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.db.$transaction([
      this.db.user.findMany({
        where,
        include: {
          assignments: { select: { id: true, grade: true, section: true } },
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * take,
        take,
      }),
      this.db.user.count({ where }),
    ]);
    return {
      items: items.map(publicUser),
      total,
      page: query.page,
      per_page: take,
      total_pages: Math.ceil(total / take),
    };
  }

  async one(id: string, actor: Actor) {
    if (actor.id !== id) this.auth.admin(actor);
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        assignments: { select: { id: true, grade: true, section: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return publicUser(user);
  }

  async create(data: z.infer<typeof userInput>, actor: Actor) {
    this.auth.admin(actor);
    validateAssignments(data.role, data.assignments);
    const passwordHash = await hash(data.password, 12);
    try {
      const user = await this.db.$transaction(async (tx) => {
        const saved = await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            gender: data.gender,
            phoneNumber: data.phoneNumber,
            role: data.role,
            active: data.active,
            passwordHash,
            assignments: { create: data.assignments },
          },
          include: {
            assignments: { select: { id: true, grade: true, section: true } },
          },
        });
        await tx.activityLog.create({
          data: {
            actorId: actor.id,
            action: 'USER_CREATED',
            entityType: 'USER',
            entityId: saved.id,
            summary: `${actor.name} created ${saved.name} (${saved.role.toLowerCase()})`,
            details: { role: saved.role, assignments: data.assignments },
          },
        });
        return saved;
      });
      return publicUser(user);
    } catch (error) {
      if (uniqueError(error))
        throw new ConflictException('Email is already in use');
      throw error;
    }
  }

  async update(id: string, patch: z.infer<typeof userPatch>, actor: Actor) {
    this.auth.admin(actor);
    if (!Object.keys(patch).length)
      throw new BadRequestException('At least one field is required');
    const existing = await this.db.user.findUnique({
      where: { id },
      include: { assignments: true },
    });
    if (!existing) throw new NotFoundException('User not found');
    if (
      id === actor.id &&
      ((patch.role && patch.role !== 'ADMIN') || patch.active === false)
    ) {
      throw new BadRequestException('You cannot remove your own admin access');
    }
    const role = patch.role ?? existing.role;
    const assignments =
      patch.assignments ??
      (role === 'ADMIN' ? [] : existing.assignments.map(({ grade, section }) => ({ grade, section })));
    validateAssignments(role, assignments);
    if (
      existing.role === 'ADMIN' &&
      (role !== 'ADMIN' || patch.active === false)
    ) {
      const activeAdmins = await this.db.user.count({
        where: { role: 'ADMIN', active: true },
      });
      if (activeAdmins <= 1)
        throw new BadRequestException('At least one active admin is required');
    }
    const passwordHash = patch.password
      ? await hash(patch.password, 12)
      : undefined;
    try {
      const user = await this.db.$transaction(async (tx) => {
        const saved = await tx.user.update({
          where: { id },
          data: {
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.email !== undefined ? { email: patch.email } : {}),
            ...(patch.gender !== undefined ? { gender: patch.gender } : {}),
            ...(patch.phoneNumber !== undefined
              ? { phoneNumber: patch.phoneNumber }
              : {}),
            ...(patch.role !== undefined ? { role: patch.role } : {}),
            ...(patch.active !== undefined ? { active: patch.active } : {}),
            ...(passwordHash ? { passwordHash } : {}),
            ...(patch.assignments !== undefined ||
            (role === 'ADMIN' && existing.role !== 'ADMIN')
              ? { assignments: { deleteMany: {}, create: assignments } }
              : {}),
          },
          include: {
            assignments: { select: { id: true, grade: true, section: true } },
          },
        });
        const changed = Object.keys(patch).filter((key) => key !== 'password');
        if (patch.password) changed.push('password');
        await tx.activityLog.create({
          data: {
            actorId: actor.id,
            action: 'USER_UPDATED',
            entityType: 'USER',
            entityId: id,
            summary: `${actor.name} updated ${saved.name}`,
            details: { fields: changed },
          },
        });
        return saved;
      });
      return publicUser(user);
    } catch (error) {
      if (uniqueError(error))
        throw new ConflictException('Email is already in use');
      throw error;
    }
  }
}

