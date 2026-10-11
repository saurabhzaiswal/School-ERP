import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './users/users.service.js';
import { StudentsService } from './students/students.service.js';
import type { Actor } from './auth/auth.schema.js';

const admin: Actor = {
  id: '0199b740-38aa-7000-8000-000000000001',
  name: 'Admin',
  email: 'admin@example.test',
  role: 'ADMIN',
  assignments: [],
};
const auth = { admin: vi.fn(), classroom: vi.fn() };

describe('resource update services', () => {
  it('clears teacher assignments when promoting a teacher to admin', async () => {
    const existing = {
      id: '0199b740-38aa-7000-8000-000000000002',
      name: 'Teacher', role: 'TEACHER', active: true,
      assignments: [{ grade: '8', section: 'A' }],
    };
    const update = vi.fn().mockImplementation(async ({ data }) => ({
      ...existing, role: data.role, passwordHash: 'private', assignments: [],
    }));
    const db = {
      user: { findUnique: vi.fn().mockResolvedValue(existing) },
      $transaction: vi.fn().mockImplementation(async (callback) => callback({
        user: { update }, activityLog: { create: vi.fn() },
      })),
    };
    const result = await new UsersService(db as never, auth as never).update(
      existing.id, { role: 'ADMIN' }, admin,
    );
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assignments: { deleteMany: {}, create: [] } }),
    }));
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('merges a partial student update and records an audit entry', async () => {
    const existing = {
      id: '0199b740-38aa-7000-8000-000000000003',
      admissionNumber: 'SCH-2026-000001',
      name: 'Student', grade: '8', section: 'A', guardianName: 'Guardian',
      email: null, phoneNumber: null, gender: null, active: true,
      feeStatus: 'PAID', amountDue: 0,
    };
    const update = vi.fn().mockImplementation(async ({ data }) => ({ ...existing, ...data }));
    const createAudit = vi.fn();
    const db = {
      student: { findUnique: vi.fn().mockResolvedValue(existing) },
      $transaction: vi.fn().mockImplementation(async (callback) => callback({
        student: { update }, activityLog: { create: createAudit },
      })),
    };
    const saved = await new StudentsService(db as never, auth as never).update(
      existing.id, { name: 'Updated student' }, admin,
    );
    expect(saved.name).toBe('Updated student');
    expect(saved.grade).toBe('8');
    expect(createAudit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'STUDENT_UPDATED' }),
    }));
  });
});
