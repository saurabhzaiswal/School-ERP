import { describe, expect, it } from 'vitest';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RecordAttendanceDto } from './dto/record-attendance.dto.js';

describe('attendance DTO', () => {
  it('rejects invalid identifiers and marks', () => {
    const input = {
      studentId: '0199b740-38aa-7000-8000-000000000002',
      date: '2026-10-11',
      status: 'PRESENT',
    };
    expect(
      validateSync(plainToInstance(RecordAttendanceDto, input)),
    ).toHaveLength(0);
    expect(
      validateSync(
        plainToInstance(RecordAttendanceDto, {
          ...input,
          studentId: 'wrong',
          status: 'UNKNOWN',
        }),
      ).length,
    ).toBeGreaterThan(0);
  });
});
