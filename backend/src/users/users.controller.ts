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
import { UsersService } from './users.service.js';

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
