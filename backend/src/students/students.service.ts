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
import { z } from 'zod';
import { PrismaService } from '../prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import {
  grade,
  section,
  pageQuery,
  limitQuery,
  perPageQuery,
  pageSize,
  parse,
  uuid,
  gender,
  contactEmail,
  phoneNumber,
} from '../validation.js';
import { studentSchema, listSchema } from './students.schema.js';
import type { Actor } from '../auth/auth.schema.js';

@Injectable()
export class StudentsService {
  constructor(
    private readonly db: PrismaService,
    private readonly auth: AuthService,
  ) {}
  async findOne(id: string, actor: Actor) {
    const student = await this.db.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    this.auth.classroom(actor, student.grade, student.section);
    return actor.role === 'ADMIN' ? student : withoutFees(student);
  }
  async list(query: z.infer<typeof listSchema>, actor: Actor) {
    const take = pageSize(query);
    if (actor.role === 'TEACHER' && actor.assignments.length === 0)
      return {
        items: [],
        total: 0,
        page: query.page,
        per_page: take,
        total_pages: 0,
      };
    const where = {
      ...(query.grade ? { grade: query.grade } : {}),
      ...(query.section ? { section: query.section } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' as const } },
              {
                admissionNumber: {
                  contains: query.q,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };
    // Keep the assignment predicate separate from search's OR.
    const secureWhere =
      actor.role === 'TEACHER'
        ? {
            AND: [
              {
                OR: actor.assignments.map((a) => ({
                  grade: a.grade,
                  section: a.section,
                })),
              },
              where,
            ],
          }
        : where;
    const [items, total] = await this.db.$transaction([
      this.db.student.findMany({
        where: secureWhere,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * take,
        take,
      }),
      this.db.student.count({ where: secureWhere }),
    ]);
    return {
      items: actor.role === 'ADMIN' ? items : items.map(withoutFees),
      total,
      page: query.page,
      per_page: take,
      total_pages: Math.ceil(total / take),
    };
  }
  async create(data: z.infer<typeof studentSchema>, actor: Actor) {
    this.auth.admin(actor);
    try {
      const [allocated] = await this.db.$queryRaw<
        { value: bigint }[]
      >`SELECT nextval('student_admission_seq') AS value`;
      const admissionNumber = `SCH-${new Date().getFullYear()}-${String(allocated.value).padStart(6, '0')}`;
      return await this.db.$transaction(async (tx) => {
        const saved = await tx.student.create({
          data: { ...data, admissionNumber },
        });
        await tx.activityLog.create({
          data: {
            actorId: actor.id,
            action: 'STUDENT_CREATED',
            entityType: 'STUDENT',
            entityId: saved.id,
            summary: `${actor.name} created student ${saved.name} (${admissionNumber})`,
            details: { grade: saved.grade, section: saved.section },
          },
        });
        return saved;
      });
    } catch (error) {
      if (isUnique(error))
        throw new ConflictException('Admission number already exists');
      throw error;
    }
  }
  async update(
    id: string,
    data: Partial<z.infer<typeof studentSchema>>,
    actor: Actor,
  ) {
    this.auth.admin(actor);
    const existing = await this.db.student.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Student not found');
    const merged = parse(studentSchema, {
      name: data.name ?? existing.name,
      gender: data.gender !== undefined ? data.gender : existing.gender,
      email: data.email !== undefined ? data.email : existing.email,
      phoneNumber:
        data.phoneNumber !== undefined
          ? data.phoneNumber
          : existing.phoneNumber,
      grade: data.grade ?? existing.grade,
      section: data.section ?? existing.section,
      guardianName: data.guardianName ?? existing.guardianName,
      active: data.active ?? existing.active,
      feeStatus: data.feeStatus ?? existing.feeStatus,
      amountDue: data.amountDue ?? Number(existing.amountDue),
    });
    try {
      return await this.db.$transaction(async (tx) => {
        const saved = await tx.student.update({ where: { id }, data: merged });
        await tx.activityLog.create({
          data: {
            actorId: actor.id,
            action: 'STUDENT_UPDATED',
            entityType: 'STUDENT',
            entityId: id,
            summary: `${actor.name} updated student ${saved.name} (${saved.admissionNumber})`,
            details: { fields: Object.keys(data) },
          },
        });
        return saved;
      });
    } catch (error) {
      if (isUnique(error))
        throw new ConflictException('Admission number already exists');
      throw error;
    }
  }
  async dues(query: z.infer<typeof listSchema>, actor: Actor) {
    this.auth.admin(actor);
    const take = pageSize(query);
    const where = {
      feeStatus: {
        in: ['PENDING', 'PARTIALLY_PAID'] as ('PENDING' | 'PARTIALLY_PAID')[],
      },
      ...(query.grade ? { grade: query.grade } : {}),
      ...(query.section ? { section: query.section } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' as const } },
              {
                admissionNumber: {
                  contains: query.q,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.db.$transaction([
      this.db.student.findMany({
        where,
        orderBy: [{ amountDue: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * take,
        take,
      }),
      this.db.student.count({ where }),
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
function isUnique(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
function withoutFees<T extends { feeStatus: unknown; amountDue: unknown }>(
  student: T,
) {
  const { feeStatus: _feeStatus, amountDue: _amountDue, ...visible } = student;
  return visible;
}

