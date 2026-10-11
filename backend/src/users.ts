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
import { PrismaService } from './prisma.service.js';
import { AuthService, type Actor } from './auth.js';
import { CreateUserDto } from './users/dto/create-user.dto.js';
import { UpdateUserDto } from './users/dto/update-user.dto.js';
import {
  grade,
  section,
  pageQuery,
  perPageQuery,
  parse,
  uuid,
  gender,
  phoneNumber,
} from './validation.js';

const assignment = z.object({ grade, section }).strict();
const userInput = z
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
const userPatch = z
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
const listQuery = z
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

function validateAssignments(
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
function publicUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}
function uniqueError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

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
      existing.assignments.map(({ grade, section }) => ({ grade, section }));
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

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}
  @Get() async list(@Req() request: Request, @Query() query: unknown) {
    return this.users.list(
      parse(listQuery, query),
      await this.auth.actor(request),
    );
  }
  @Get('stats') async stats(@Req() request: Request) {
    return this.users.stats(await this.auth.actor(request));
  }
  @Get(':id') async one(@Req() request: Request, @Param('id') id: string) {
    return this.users.one(parse(uuid, id), await this.auth.actor(request));
  }
  @Post() async create(@Req() request: Request, @Body() body: CreateUserDto) {
    return this.users.create(
      parse(userInput, body),
      await this.auth.actor(request),
    );
  }
  @Patch(':id') async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.users.update(
      parse(uuid, id),
      parse(userPatch, body),
      await this.auth.actor(request),
    );
  }
}
