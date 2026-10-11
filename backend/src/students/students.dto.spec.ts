import { describe, expect, it } from 'vitest';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateStudentDto } from './dto/create-student.dto.js';

describe('student DTO', () => {
  const input = {
    name: 'Asha Rao',
    grade: '8',
    section: 'A',
    guardianName: 'Rina Rao',
    feeStatus: 'PAID',
    amountDue: 0,
  };
  it('rejects an invalid class and fractional cents', () => {
    expect(
      validateSync(
        plainToInstance(CreateStudentDto, {
          ...input,
          grade: '13',
          amountDue: 1.234,
        }),
      ).length,
    ).toBeGreaterThan(0);
    expect(validateSync(plainToInstance(CreateStudentDto, input))).toHaveLength(
      0,
    );
  });
  it('validates optional contact details', () => {
    expect(
      validateSync(
        plainToInstance(CreateStudentDto, {
          ...input,
          gender: 'FEMALE',
          email: 'asha@school.test',
          phoneNumber: '+919876543210',
        }),
      ),
    ).toHaveLength(0);
    expect(
      validateSync(
        plainToInstance(CreateStudentDto, {
          ...input,
          email: 'invalid',
          phoneNumber: '123',
        }),
      ).length,
    ).toBeGreaterThan(0);
  });
});
