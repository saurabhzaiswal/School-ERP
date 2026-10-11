import { describe, expect, it } from 'vitest';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto.js';

describe('user DTO', () => {
  const input = {
    name: 'Teacher One',
    email: 'teacher@school.test',
    role: 'TEACHER',
    password: 'strong-pass-123',
    assignments: [{ grade: '8', section: 'A' }],
  };
  it('validates nested class assignments', () => {
    expect(validateSync(plainToInstance(CreateUserDto, input))).toHaveLength(0);
    expect(
      validateSync(
        plainToInstance(CreateUserDto, {
          ...input,
          assignments: [{ grade: '8', section: 'Z' }],
        }),
      ).length,
    ).toBeGreaterThan(0);
  });
  it('validates optional staff gender and phone', () => {
    expect(
      validateSync(
        plainToInstance(CreateUserDto, {
          ...input,
          gender: 'OTHER',
          phoneNumber: '+919876543210',
        }),
      ),
    ).toHaveLength(0);
    expect(
      validateSync(
        plainToInstance(CreateUserDto, {
          ...input,
          gender: 'INVALID',
          phoneNumber: '123',
        }),
      ).length,
    ).toBeGreaterThan(0);
  });
});
