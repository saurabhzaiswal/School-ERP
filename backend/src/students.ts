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
import { PrismaService } from './prisma.service.js';
import { AuthService, type Actor } from './auth.js';
import { CreateStudentDto } from './students/dto/create-student.dto.js';
import { UpdateStudentDto } from './students/dto/update-student.dto.js';
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
} from './validation.js';

const studentSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    gender: gender.nullable().optional(),
    email: contactEmail,
    phoneNumber,
    grade,
    section,
    guardianName: z.string().trim().min(2).max(100),
    active: z.boolean().default(true),
    feeStatus: z.enum(['PAID', 'PENDING', 'PARTIALLY_PAID']).default('PAID'),
    amountDue: z.coerce
      .number()
      .min(0)
      .max(99999999)
      .refine(
        (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-8,
        'Use at most two decimal places',
      )
      .default(0),
  })
  .strict()
  .refine(
    (v) => (v.feeStatus === 'PAID' ? v.amountDue === 0 : v.amountDue > 0),
    'Paid requires zero due; outstanding statuses require a positive due',
  );
const listSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    grade: grade.optional(),
    section: section.optional(),
    page: pageQuery,
    per_page: perPageQuery,
    limit: limitQuery.optional(),
  })
  .strict();

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

@Controller('students')
export class StudentsController {
  constructor(
    private readonly service: StudentsService,
    private readonly auth: AuthService,
  ) {}
  @Get() async list(@Req() req: Request, @Query() query: unknown) {
    return this.service.list(
      parse(listSchema, query),
      await this.auth.actor(req),
    );
  }
  @Get('dues') async dues(@Req() req: Request, @Query() query: unknown) {
    return this.service.dues(
      parse(listSchema, query),
      await this.auth.actor(req),
    );
  }
  @Get(':id') async one(@Req() req: Request, @Param('id') id: string) {
    return this.service.findOne(parse(uuid, id), await this.auth.actor(req));
  }
  @Post() async create(@Req() req: Request, @Body() body: CreateStudentDto) {
    return this.service.create(
      parse(studentSchema, body),
      await this.auth.actor(req),
    );
  }
  @Patch(':id') async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdateStudentDto,
  ) {
    const patch = parse(studentSchema.safeExtend({}).partial().strict(), body);
    if (Object.keys(patch).length === 0)
      throw new BadRequestException('At least one field is required');
    return this.service.update(
      parse(uuid, id),
      patch,
      await this.auth.actor(req),
    );
  }
}
