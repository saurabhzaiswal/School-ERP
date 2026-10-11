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
import { AttendanceService } from './attendance.service.js';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
    private readonly auth: AuthService,
  ) {}
  @Get() async byClass(@Req() req: Request, @Query() query: unknown) {
    return this.service.byClass(
      parse(classQuery, query),
      await this.auth.actor(req),
    );
  }
  @Get('student/:studentId') async history(
    @Req() req: Request,
    @Param('studentId') id: string,
    @Query() query: unknown,
  ) {
    return this.service.history(
      parse(uuid, id),
      parse(historyQuery, query),
      await this.auth.actor(req),
    );
  }
  @Post() async record(@Req() req: Request, @Body() body: RecordAttendanceDto) {
    return this.service.record(
      parse(recordSchema, body),
      await this.auth.actor(req),
    );
  }
  @Put(':id') async correct(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: CorrectAttendanceDto,
  ) {
    return this.service.correct(
      parse(uuid, id),
      parse(correctionSchema, body).status,
      await this.auth.actor(req),
    );
  }
}
