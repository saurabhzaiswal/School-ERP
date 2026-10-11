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
import { status, recordSchema, correctionSchema, classQuery, historyQuery } from './attendance.schema.js';
import type { Actor } from '../auth/auth.schema.js';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly db: PrismaService,
    private readonly auth: AuthService,
  ) {}
  async record(data: z.infer<typeof recordSchema>, actor: Actor) {
    const student = await this.db.student.findUnique({
      where: { id: data.studentId },
    });
    if (!student) throw new NotFoundException('Student not found');
    this.auth.classroom(actor, student.grade, student.section);
    if (!student.active)
      throw new BadRequestException(
        'Cannot record attendance for an inactive student',
      );
    try {
      return await this.db.$transaction(async (tx) => {
        const row = await tx.attendance.create({
          data: { ...data, recordedById: actor.id },
        });
        await tx.attendanceAudit.create({
          data: {
            attendanceId: row.id,
            changedById: actor.id,
            newStatus: data.status,
          },
        });
        await tx.activityLog.create({
          data: {
            actorId: actor.id,
            action: 'ATTENDANCE_RECORDED',
            entityType: 'ATTENDANCE',
            entityId: row.id,
            summary: `${actor.name} marked ${student.name} ${data.status.toLowerCase()}`,
            details: {
              studentId: student.id,
              date: data.date.toISOString().slice(0, 10),
              status: data.status,
            },
          },
        });
        return row;
      });
    } catch (error) {
      if (isUnique(error))
        throw new ConflictException(
          'Attendance already recorded for this student and date. Use correction.',
        );
      throw error;
    }
  }
  async correct(id: string, newStatus: z.infer<typeof status>, actor: Actor) {
    const row = await this.db.attendance.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!row) throw new NotFoundException('Attendance not found');
    this.auth.classroom(actor, row.student.grade, row.student.section);
    if (row.status === newStatus)
      throw new BadRequestException('Status is unchanged');
    return this.db.$transaction(async (tx) => {
      const updated = await tx.attendance.update({
        where: { id },
        data: { status: newStatus, recordedById: actor.id },
      });
      await tx.attendanceAudit.create({
        data: {
          attendanceId: id,
          changedById: actor.id,
          oldStatus: row.status,
          newStatus,
        },
      });
      await tx.activityLog.create({
        data: {
          actorId: actor.id,
          action: 'ATTENDANCE_CORRECTED',
          entityType: 'ATTENDANCE',
          entityId: id,
          summary: `${actor.name} corrected ${row.student.name}'s attendance`,
          details: {
            studentId: row.studentId,
            date: row.date.toISOString().slice(0, 10),
            from: row.status,
            to: newStatus,
          },
        },
      });
      return updated;
    });
  }
  async byClass(query: z.infer<typeof classQuery>, actor: Actor) {
    this.auth.classroom(actor, query.grade, query.section);
    const page = query.page ?? 1;
    const take = pageSize(query);
    const where = { grade: query.grade, section: query.section, active: true };
    const [students, total, marks] = await Promise.all([
      this.db.student.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * take,
        take,
        include: {
          attendance: {
            where: { date: query.date },
            select: { id: true, status: true },
          },
        },
      }),
      this.db.student.count({ where }),
      this.db.attendance.groupBy({
        by: ['status'],
        where: { date: query.date, student: where },
        _count: { status: true },
      }),
    ]);
    const totals = { PRESENT: 0, ABSENT: 0, LATE: 0, UNMARKED: 0 };
    for (const mark of marks) totals[mark.status] = mark._count.status;
    totals.UNMARKED = total - totals.PRESENT - totals.ABSENT - totals.LATE;
    const items = students.map(({ attendance, ...student }) => {
      const mark = attendance[0] ?? null;
      return {
        ...(actor.role === 'ADMIN' ? student : withoutFees(student)),
        attendance: mark,
      };
    });
    return {
      items,
      totals,
      total,
      page,
      per_page: take,
      total_pages: Math.ceil(total / take),
      date: query.date.toISOString().slice(0, 10),
    };
  }
  async history(
    studentId: string,
    query: z.infer<typeof historyQuery>,
    actor: Actor,
  ) {
    const take = pageSize(query);
    const student = await this.db.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');
    this.auth.classroom(actor, student.grade, student.section);
    const [items, total] = await this.db.$transaction([
      this.db.attendance.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        skip: (query.page - 1) * take,
        take,
      }),
      this.db.attendance.count({ where: { studentId } }),
    ]);
    return {
      student: actor.role === 'ADMIN' ? student : withoutFees(student),
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

