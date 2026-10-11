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
import {
  studentSchema,
  updateStudentSchema,
  listSchema,
} from './students.schema.js';
import type { Actor } from '../auth/auth.schema.js';
import { StudentsService } from './students.service.js';

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

  @Patch(':id')
async update(
  @Req() req: Request,
  @Param('id') id: string,
  @Body() body: UpdateStudentDto,
) {
  const patch = parse(updateStudentSchema, body);

  if (Object.keys(patch).length === 0) {
    throw new BadRequestException('At least one field is required');
  }

  return this.service.update(
    parse(uuid, id),
    patch,
    await this.auth.actor(req),
  );
}

}
