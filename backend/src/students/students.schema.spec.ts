import { describe, expect, it } from 'vitest';
import { studentSchema, updateStudentSchema } from './students.schema.js';

describe('student schemas', () => {
  it('does not add create defaults to a name-only patch', () => {
    expect(updateStudentSchema.parse({ name: 'Updated Name' })).toEqual({ name: 'Updated Name' });
    expect(updateStudentSchema.parse({ amountDue: 100 })).toEqual({ amountDue: 100 });
  });

  it('adds defaults only when creating a student', () => {
    const created = studentSchema.parse({ name: 'Asha Rao', grade: '8', section: 'A', guardianName: 'Rina Rao' });
    expect(created).toMatchObject({ active: true, feeStatus: 'PAID', amountDue: 0 });
  });
});
